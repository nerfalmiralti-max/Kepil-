-- New Auth users enter as unprivileged members. Existing assignments are retained.
alter table public.profiles alter column organization_id drop not null;
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('USER', 'ADMIN', 'INSPECTOR', 'CONTRACTOR'));
alter table public.profiles add constraint profiles_role_organization_check
  check ((role = 'USER' and organization_id is null)
      or (role <> 'USER' and organization_id is not null));

-- Contractor ownership must require the contractor role, even if an org is assigned.
create or replace function private.owns_contractor(cid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.contractors c
    join public.profiles p on p.organization_id = c.organization_id
    where c.id = cid and p.id = auth.uid() and p.role = 'CONTRACTOR'
  )
$$;

create function private.profile_name(user_email text, metadata jsonb) returns text
language sql immutable set search_path = '' as $$
  select left(coalesce(nullif(trim(metadata ->> 'full_name'), ''),
                       nullif(trim(metadata ->> 'name'), ''),
                       split_part(user_email, '@', 1)), 200)
$$;

create function private.sync_auth_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- A pending email is not a verified identity. Confirmation or Google OAuth
  -- causes the subsequent Auth update to provision the profile.
  if new.email is null or new.email_confirmed_at is null then
    return new;
  end if;
  insert into public.profiles (id, email, full_name, role, organization_id)
  values (new.id, new.email, private.profile_name(new.email, new.raw_user_meta_data), 'USER', null)
  on conflict (id) do update set email = excluded.email;
  return new;
end
$$;

create trigger sync_auth_profile_after_insert_or_update
after insert or update of email, email_confirmed_at, raw_user_meta_data on auth.users
for each row execute function private.sync_auth_profile();

insert into public.profiles (id, email, full_name, role, organization_id)
select u.id, u.email, private.profile_name(u.email, u.raw_user_meta_data), 'USER', null
from auth.users u
where u.email is not null and u.email_confirmed_at is not null
on conflict (id) do nothing;

-- Recovery path for a confirmed user if a profile was removed after signup.
create function private.ensure_own_profile() returns void
language plpgsql security definer set search_path = '' as $$
declare u auth.users;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into u from auth.users where id = auth.uid();
  if u.id is null or u.email is null or u.email_confirmed_at is null then
    raise exception 'Verified email required';
  end if;
  insert into public.profiles (id, email, full_name, role, organization_id)
  values (u.id, u.email, private.profile_name(u.email, u.raw_user_meta_data), 'USER', null)
  on conflict (id) do nothing;
end
$$;
create function public.ensure_own_profile() returns void
language sql security invoker set search_path = '' as $$
  select private.ensure_own_profile()
$$;

create function private.assign_user_role(target_user uuid, target_role text, target_org uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare actor public.profiles; old_profile public.profiles; org_type text;
begin
  actor := private.current_profile();
  if actor.role <> 'ADMIN' then raise exception 'Permission denied: admin required'; end if;
  if target_user is null or target_role is null
     or target_role not in ('USER', 'INSPECTOR', 'CONTRACTOR', 'ADMIN') then
    raise exception 'Invalid role';
  end if;
  if target_user = actor.id then raise exception 'Cannot change your own role'; end if;
  select * into old_profile from public.profiles where id = target_user for update;
  if old_profile.id is null then raise exception 'Profile not found'; end if;
  if target_role = 'USER' then
    if target_org is not null then raise exception 'USER must not have an organization'; end if;
  else
    if target_org is null then raise exception 'Organization required'; end if;
    select type into org_type from public.organizations where id = target_org;
    if org_type is null then raise exception 'Organization not found'; end if;
    if target_role = 'CONTRACTOR' and
       (org_type <> 'CONTRACTOR' or not exists (
         select 1 from public.contractors where organization_id = target_org)) then
      raise exception 'Contractor organization required';
    end if;
    if target_role in ('ADMIN', 'INSPECTOR') and org_type = 'CONTRACTOR' then
      raise exception 'Municipal organization required';
    end if;
  end if;
  if old_profile.role = target_role and old_profile.organization_id is not distinct from target_org then
    return;
  end if;
  update public.profiles set role = target_role, organization_id = target_org where id = target_user;
  perform private.log_event(actor, 'PROFILE_ROLE_CHANGED', 'profile', target_user,
    jsonb_build_object('oldRole', old_profile.role, 'newRole', target_role,
                       'oldOrganizationId', old_profile.organization_id,
                       'newOrganizationId', target_org));
end
$$;
create function public.assign_user_role(target_user uuid, target_role text, target_org uuid)
returns void language sql security invoker set search_path = '' as $$
  select private.assign_user_role(target_user, target_role, target_org)
$$;

revoke all on function private.profile_name(text,jsonb), private.sync_auth_profile(),
  private.ensure_own_profile(), private.assign_user_role(uuid,text,uuid),
  public.ensure_own_profile(), public.assign_user_role(uuid,text,uuid)
  from public, anon, authenticated;
grant execute on function private.ensure_own_profile(), private.assign_user_role(uuid,text,uuid)
  to authenticated;
grant execute on function public.ensure_own_profile(), public.assign_user_role(uuid,text,uuid)
  to authenticated;

-- KEPIL baseline. Run once in a new Supabase project. Mutations use authenticated RPCs.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 2 and 200),
 type text not null check(type in ('AKIMAT','MUNICIPAL_SERVICE','CONTRACTOR')), created_at timestamptz not null default now()
);
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade, email text not null, full_name text not null,
 role text not null check(role in ('ADMIN','INSPECTOR','CONTRACTOR')), organization_id uuid not null references organizations(id), created_at timestamptz not null default now()
);
create table public.contractors (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null unique references organizations(id), name text not null,
 bin_or_demo_identifier text not null unique, contact_name text not null default '', contact_phone text not null default '', created_at timestamptz not null default now()
);
create table public.contracts (
 id uuid primary key default gen_random_uuid(), contract_number text not null unique, contractor_id uuid not null references contractors(id),
 title text not null, start_date date not null, completion_date date not null, description text not null default '', created_at timestamptz not null default now(), check(completion_date>=start_date)
);
create table public.assets (
 id uuid primary key default gen_random_uuid(), name text not null, asset_code text not null unique,
 asset_type text not null check(asset_type in ('WATER','LIGHTING','ROAD','PUBLIC_SPACE')), microdistrict text not null, address text not null,
 latitude numeric check(latitude between -90 and 90), longitude numeric check(longitude between -180 and 180),
 contract_id uuid not null references contracts(id), commissioned_at date not null, description text not null default '', created_at timestamptz not null default now()
);
create table public.warranties (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), contractor_id uuid not null references contractors(id),
 starts_at date not null, expires_at date not null, terms text not null, status text not null default 'ACTIVE' check(status in ('ACTIVE','CANCELLED')),
 created_at timestamptz not null default now(), check(expires_at>=starts_at)
);
create table public.defects (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), title text not null check(length(trim(title)) between 3 and 150),
 description text not null check(length(trim(description)) between 10 and 5000), category text not null check(category in ('WATER_LEAK','LIGHTING','SURFACE','EQUIPMENT','OTHER')),
 severity text not null check(severity in ('LOW','MEDIUM','HIGH','CRITICAL')), reported_at timestamptz not null default now(), reporter_id uuid not null references profiles(id),
 status text not null default 'REPORTED' check(status in ('REPORTED','CLAIM_CREATED','RESOLVED')), repeat_defect boolean not null default false,
 repeat_count integer not null default 1, previous_defect_ids uuid[] not null default '{}', request_id uuid not null unique, created_at timestamptz not null default now()
);
create table public.warranty_claims (
 id uuid primary key default gen_random_uuid(), claim_number bigint generated always as identity unique, defect_id uuid not null unique references defects(id),
 warranty_id uuid not null references warranties(id), contractor_id uuid not null references contractors(id),
 status text not null default 'OPEN' check(status in ('OPEN','ACKNOWLEDGED','IN_PROGRESS','REPAIR_SUBMITTED','VERIFIED','REJECTED')),
 response_deadline timestamptz not null, repair_deadline timestamptz not null, assigned_at timestamptz not null default now(),
 acknowledged_at timestamptz, completed_at timestamptz, verified_at timestamptz, rejected_at timestamptz,
 created_at timestamptz not null default now(), check(repair_deadline>=response_deadline)
);
create table public.claim_evidence (
 id uuid primary key default gen_random_uuid(), claim_id uuid not null references warranty_claims(id), uploaded_by uuid not null references profiles(id),
 storage_path text not null unique, evidence_type text not null check(evidence_type in ('BEFORE','AFTER')), note text not null default '', created_at timestamptz not null default now()
);
create table public.inspections (
 id uuid primary key default gen_random_uuid(), claim_id uuid not null references warranty_claims(id), inspector_id uuid not null references profiles(id),
 result text not null check(result in ('APPROVED','REJECTED')), comment text not null default '', created_at timestamptz not null default now(), check(result<>'REJECTED' or length(trim(comment))>=5)
);
create table public.status_history (
 id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id uuid not null, from_status text, to_status text not null,
 changed_by uuid not null references profiles(id), actor_name text not null, reason text not null default '', created_at timestamptz not null default now()
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id), claim_id uuid references warranty_claims(id),
 type text not null, title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid references profiles(id), actor_name text not null, action text not null,
 entity_type text not null, entity_id uuid not null, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table private.settings (key text primary key, value integer not null check(value>0));
insert into private.settings values ('repeat_window_days',90);

create index on profiles(organization_id); create index on contracts(contractor_id); create index on assets(contract_id);
create index on warranties(asset_id,expires_at); create index on warranties(contractor_id);
create index on defects(asset_id,category,reported_at desc); create index on defects(reporter_id);
create index on warranty_claims(contractor_id,status); create index on warranty_claims(warranty_id);
create index on warranty_claims(repair_deadline) where status not in ('VERIFIED','REPAIR_SUBMITTED');
create index on claim_evidence(claim_id,created_at); create index on claim_evidence(uploaded_by);
create index on inspections(claim_id); create index on inspections(inspector_id);
create index on status_history(entity_id,created_at); create index on status_history(changed_by);
create index on notifications(user_id,created_at desc); create index on notifications(claim_id);
create index on audit_logs(entity_id,created_at); create index on audit_logs(actor_id);

create function private.current_profile() returns public.profiles language plpgsql stable security definer set search_path='' as $$
declare p public.profiles;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into p from public.profiles where id=auth.uid();
 if p.id is null then raise exception 'Profile not provisioned'; end if;
 return p;
end $$;
create function private.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role in ('ADMIN','INSPECTOR'))
$$;
create function private.owns_contractor(cid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.contractors c join public.profiles p on p.organization_id=c.organization_id where c.id=cid and p.id=auth.uid())
$$;
create function private.can_claim(cid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.warranty_claims c where c.id=cid and (private.is_staff() or private.owns_contractor(c.contractor_id)))
$$;

-- Every exposed table has RLS. Authenticated users have SELECT only; transactional RPCs own mutations.
do $$ declare t text; begin
 foreach t in array array['organizations','profiles','contractors','contracts','assets','warranties','defects','warranty_claims','claim_evidence','inspections','status_history','notifications','audit_logs'] loop
 execute format('alter table public.%I enable row level security', t);
 execute format('revoke all on public.%I from anon, authenticated', t);
 execute format('grant select on public.%I to authenticated', t);
 end loop;
end $$;
create policy read_org on organizations for select to authenticated using(private.is_staff() or id=(select organization_id from profiles where id=auth.uid()));
create policy read_profile on profiles for select to authenticated using(id=auth.uid() or private.is_staff());
create policy read_contractor on contractors for select to authenticated using(private.is_staff() or private.owns_contractor(id));
create policy read_contract on contracts for select to authenticated using(private.is_staff() or private.owns_contractor(contractor_id));
create policy read_asset on assets for select to authenticated using(private.is_staff() or exists(select 1 from contracts c where c.id=contract_id and private.owns_contractor(c.contractor_id)));
create policy read_warranty on warranties for select to authenticated using(private.is_staff() or private.owns_contractor(contractor_id));
create policy read_defect on defects for select to authenticated using(private.is_staff() or exists(select 1 from warranty_claims c where c.defect_id=defects.id and private.owns_contractor(c.contractor_id)));
create policy read_claim on warranty_claims for select to authenticated using(private.is_staff() or private.owns_contractor(contractor_id));
create policy read_evidence on claim_evidence for select to authenticated using(private.can_claim(claim_id));
create policy read_inspection on inspections for select to authenticated using(private.can_claim(claim_id));
create policy read_history on status_history for select to authenticated using(private.is_staff() or (entity_type='claim' and private.can_claim(entity_id)));
create policy read_audit on audit_logs for select to authenticated using(private.is_staff() or (entity_type='claim' and private.can_claim(entity_id)));
create policy read_notification on notifications for select to authenticated using(user_id=auth.uid());

create function public.claim_sla(s text, response_due timestamptz, repair_due timestamptz) returns text language sql stable set search_path='' as $$
 select case when s='VERIFIED' then 'COMPLETED' when s='REPAIR_SUBMITTED' then 'ON_TIME'
 when (case when s='OPEN' then response_due else repair_due end)<now() then 'OVERDUE'
 when (case when s='OPEN' then response_due else repair_due end)<=now()+interval '24 hours' then 'DUE_SOON' else 'ON_TIME' end
$$;
create view public.claims_overview with(security_invoker=true) as
select c.*, d.asset_id,d.title,d.category,d.severity,d.repeat_defect,a.name asset_name,a.asset_code,a.microdistrict,k.name contractor_name,
 public.claim_sla(c.status,c.response_deadline,c.repair_deadline) sla_status
from warranty_claims c join defects d on d.id=c.defect_id join assets a on a.id=d.asset_id join contractors k on k.id=c.contractor_id;
grant select on claims_overview to authenticated;

create function private.log_event(p public.profiles, action_name text, entity text, eid uuid, meta jsonb default '{}') returns void language sql security definer set search_path='' as $$
 insert into public.audit_logs(actor_id,actor_name,action,entity_type,entity_id,metadata) values(p.id,p.full_name,action_name,entity,eid,meta)
$$;
create function private.claim_result(did uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('defectId',d.id,'claimId',c.id,'claimNumber',c.claim_number,
 'warrantyStatus',case when c.id is not null then 'ACTIVE' when exists(select 1 from public.warranties w where w.asset_id=d.asset_id and w.status='ACTIVE' and w.expires_at<(d.reported_at at time zone 'Asia/Aqtau')::date) then 'EXPIRED' else 'NOT_FOUND' end,
 'expiresAt',w.expires_at,'remainingWarrantyDays',greatest(0,w.expires_at-(d.reported_at at time zone 'Asia/Aqtau')::date),
 'contractor',case when k.id is null then null else to_jsonb(k) end,'repeatDefect',d.repeat_defect,'repeatCount',d.repeat_count,'previousDefectIds',d.previous_defect_ids,
 'daysSincePreviousDefect',(select floor(extract(epoch from (d.reported_at-max(x.reported_at)))/86400) from public.defects x where x.id=any(d.previous_defect_ids)))
 from public.defects d left join public.warranty_claims c on c.defect_id=d.id left join public.warranties w on w.id=c.warranty_id left join public.contractors k on k.id=c.contractor_id where d.id=did
$$;
create function private.submit_defect(aid uuid, cat text, sev text, heading text, description_text text, rid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles; w public.warranties; d public.defects; cid uuid; previous uuid[]; window_days integer; response_hours integer; repair_days integer;
begin
 p:=private.current_profile();
 if p.role not in ('ADMIN','INSPECTOR') then raise exception 'Permission denied: inspector required'; end if;
 if cat is null or cat not in ('WATER_LEAK','LIGHTING','SURFACE','EQUIPMENT','OTHER') then raise exception 'Invalid category'; end if;
 if sev is null or sev not in ('LOW','MEDIUM','HIGH','CRITICAL') then raise exception 'Invalid severity'; end if;
 if rid is null or heading is null or length(trim(heading)) not between 3 and 150 or description_text is null or length(trim(description_text)) not between 10 and 5000 then raise exception 'Invalid defect input'; end if;
 perform 1 from public.assets where id=aid for update;
 if not found then raise exception 'Asset not found'; end if;
 select * into d from public.defects where request_id=rid;
 if found then
   if d.reporter_id<>p.id or d.asset_id<>aid or d.category<>cat or d.severity<>sev or d.title<>trim(heading) or d.description<>trim(description_text) then raise exception 'Request ID conflict'; end if;
   return private.claim_result(d.id);
 end if;
 select value into window_days from private.settings where key='repeat_window_days';
 select coalesce(array_agg(id order by reported_at desc),'{}') into previous from public.defects where asset_id=aid and category=cat and reported_at>=now()-make_interval(days=>window_days);
 insert into public.defects(asset_id,title,description,category,severity,reporter_id,repeat_defect,repeat_count,previous_defect_ids,request_id)
 values(aid,trim(heading),trim(description_text),cat,sev,p.id,cardinality(previous)>0,cardinality(previous)+1,previous,rid) returning * into d;
 perform private.log_event(p,'DEFECT_SUBMITTED','defect',d.id,jsonb_build_object('assetId',aid,'repeatCount',d.repeat_count));
 insert into public.status_history(entity_type,entity_id,to_status,changed_by,actor_name) values('defect',d.id,'REPORTED',p.id,p.full_name);
 select * into w from public.warranties where asset_id=aid and status='ACTIVE' and starts_at<=(now() at time zone 'Asia/Aqtau')::date and expires_at>=(now() at time zone 'Asia/Aqtau')::date order by expires_at desc limit 1;
 if found then
 response_hours:=case sev when 'CRITICAL' then 4 when 'HIGH' then 12 else 24 end;
 repair_days:=case sev when 'CRITICAL' then 1 when 'HIGH' then 3 when 'MEDIUM' then 7 else 14 end;
 insert into public.warranty_claims(defect_id,warranty_id,contractor_id,response_deadline,repair_deadline) values(d.id,w.id,w.contractor_id,now()+make_interval(hours=>response_hours),now()+make_interval(days=>repair_days)) returning id into cid;
 update public.defects set status='CLAIM_CREATED' where id=d.id;
 insert into public.status_history(entity_type,entity_id,from_status,to_status,changed_by,actor_name,reason) values('defect',d.id,'REPORTED','CLAIM_CREATED',p.id,p.full_name,'Создана гарантийная заявка.');
 insert into public.status_history(entity_type,entity_id,to_status,changed_by,actor_name,reason) values('claim',cid,'OPEN',p.id,p.full_name,'Гарантия найдена. Ответственный подрядчик определён.');
 perform private.log_event(p,'CLAIM_CREATED','claim',cid,jsonb_build_object('warrantyId',w.id,'assetId',aid,'contractorId',w.contractor_id));
 insert into public.notifications(user_id,claim_id,type,title,body) select x.id,cid,'CLAIM_CREATED','Новая гарантийная заявка',trim(heading) from public.profiles x join public.contractors k on k.organization_id=x.organization_id where k.id=w.contractor_id and x.role='CONTRACTOR';
 end if;
 return private.claim_result(d.id);
end $$;
create function public.submit_defect(aid uuid, cat text, sev text, heading text, description_text text, rid uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.submit_defect(aid,cat,sev,heading,description_text,rid) $$;

create function private.transition_claim(cid uuid, target text, comment_text text) returns uuid language plpgsql security definer set search_path='' as $$
declare p public.profiles; c public.warranty_claims; action_name text;
begin
 p:=private.current_profile();
 select * into c from public.warranty_claims where id=cid for update;
 if not found or not private.can_claim(cid) then raise exception 'Permission denied: claim access'; end if;
 if target is null or target not in ('ACKNOWLEDGED','IN_PROGRESS','REPAIR_SUBMITTED','VERIFIED','REJECTED') then raise exception 'Invalid transition target'; end if;
 if length(coalesce(comment_text,''))>3000 then raise exception 'Comment too long'; end if;
 if target in ('VERIFIED','REJECTED') and p.role not in ('ADMIN','INSPECTOR') then raise exception 'Permission denied: inspector required'; end if;
 if target in ('ACKNOWLEDGED','IN_PROGRESS','REPAIR_SUBMITTED') and p.role not in ('ADMIN','CONTRACTOR') then raise exception 'Permission denied: contractor required'; end if;
 if not ((c.status='OPEN' and target='ACKNOWLEDGED') or (c.status in ('ACKNOWLEDGED','REJECTED') and target='IN_PROGRESS') or (c.status='IN_PROGRESS' and target='REPAIR_SUBMITTED') or (c.status='REPAIR_SUBMITTED' and target in ('VERIFIED','REJECTED'))) then raise exception 'Invalid state transition: % -> %',c.status,target; end if;
 if target='REJECTED' and length(trim(coalesce(comment_text,'')))<5 then raise exception 'Rejection requires a comment (5 characters minimum)'; end if;
 if target='REPAIR_SUBMITTED' and not exists(select 1 from public.claim_evidence where claim_id=cid and evidence_type='AFTER' and (c.rejected_at is null or created_at>c.rejected_at)) then raise exception 'Repair evidence required (new evidence after rejection)'; end if;
 if public.claim_sla(c.status,c.response_deadline,c.repair_deadline)='OVERDUE' and not exists(select 1 from public.audit_logs where entity_id=cid and action='DEADLINE_MISSED' and metadata->>'stage'=case when c.status='OPEN' then 'response' else 'repair' end) then
 perform private.log_event(p,'DEADLINE_MISSED','claim',cid,jsonb_build_object('stage',case when c.status='OPEN' then 'response' else 'repair' end)); end if;
 update public.warranty_claims set status=target,
 acknowledged_at=case when target='ACKNOWLEDGED' then now() else acknowledged_at end,
 completed_at=case when target='REPAIR_SUBMITTED' then now() when target='REJECTED' then null else completed_at end,
 rejected_at=case when target='REJECTED' then now() else rejected_at end,
 verified_at=case when target='VERIFIED' then now() else verified_at end where id=cid;
 if target in ('VERIFIED','REJECTED') then
 insert into public.inspections(claim_id,inspector_id,result,comment) values(cid,p.id,case when target='VERIFIED' then 'APPROVED' else 'REJECTED' end,coalesce(comment_text,'')); end if;
 if target='VERIFIED' then
 update public.defects set status='RESOLVED' where id=c.defect_id;
 insert into public.status_history(entity_type,entity_id,from_status,to_status,changed_by,actor_name,reason) values('defect',c.defect_id,'CLAIM_CREATED','RESOLVED',p.id,p.full_name,'Инспектор подтвердил устранение дефекта.');
 end if;
 insert into public.status_history(entity_type,entity_id,from_status,to_status,changed_by,actor_name,reason) values('claim',cid,c.status,target,p.id,p.full_name,coalesce(comment_text,''));
 action_name:=case target when 'ACKNOWLEDGED' then 'CLAIM_ACKNOWLEDGED' when 'IN_PROGRESS' then 'REPAIR_STARTED' when 'REPAIR_SUBMITTED' then 'REPAIR_SUBMITTED' when 'VERIFIED' then 'VERIFICATION_APPROVED' else 'VERIFICATION_REJECTED' end;
 perform private.log_event(p,action_name,'claim',cid,jsonb_build_object('from',c.status,'to',target,'comment',comment_text));
 insert into public.notifications(user_id,claim_id,type,title,body) select x.id,cid,action_name,'Статус заявки изменён','KEP-'||c.claim_number||': '||target from public.profiles x where x.id<>p.id and (x.role in ('ADMIN','INSPECTOR') or x.organization_id=(select organization_id from public.contractors where id=c.contractor_id));
 return cid;
end $$;
create function public.transition_claim(cid uuid, target text, comment_text text default '') returns uuid language sql security invoker set search_path='' as $$ select private.transition_claim(cid,target,comment_text) $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('claim-evidence','claim-evidence',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create function private.can_upload(path text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare cid uuid; p public.profiles;
begin
 if auth.uid() is null then return false; end if;
 begin cid:=split_part(path,'/',1)::uuid; exception when invalid_text_representation then return false; end;
 p:=private.current_profile();
 return exists(select 1 from public.warranty_claims c where c.id=cid and c.status in ('ACKNOWLEDGED','IN_PROGRESS','REJECTED') and (p.role='ADMIN' or (p.role='CONTRACTOR' and private.owns_contractor(c.contractor_id))));
end $$;
create function private.can_read_file(path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.claim_evidence e where e.storage_path=path and private.can_claim(e.claim_id))
$$;
create policy evidence_read on storage.objects for select to authenticated using(bucket_id='claim-evidence' and (private.can_read_file(name) or (owner_id=auth.uid()::text and private.can_upload(name))));
create policy evidence_insert on storage.objects for insert to authenticated with check(bucket_id='claim-evidence' and private.can_upload(name));
create policy evidence_cleanup on storage.objects for delete to authenticated using(bucket_id='claim-evidence' and owner_id=auth.uid()::text and not exists(select 1 from public.claim_evidence e where e.storage_path=name));

create function private.record_evidence(cid uuid, path text, kind text, note_text text) returns uuid language plpgsql security definer set search_path='' as $$
declare p public.profiles; eid uuid;
begin
 p:=private.current_profile();
 perform 1 from public.warranty_claims where id=cid for update;
 if split_part(path,'/',1)<>cid::text or not private.can_upload(path) then raise exception 'Permission denied: upload'; end if;
 if kind is null or kind not in ('BEFORE','AFTER') or length(coalesce(note_text,''))>2000 then raise exception 'Invalid evidence metadata'; end if;
 if not exists(select 1 from storage.objects where bucket_id='claim-evidence' and name=path and owner_id=p.id::text and (metadata->>'size')::bigint between 1 and 5242880 and metadata->>'mimetype' in ('image/jpeg','image/png','image/webp')) then raise exception 'Uploaded evidence file not found or invalid'; end if;
 if exists(select 1 from public.warranty_claims c join storage.objects o on o.bucket_id='claim-evidence' and o.name=path where c.id=cid and c.rejected_at is not null and (o.created_at is null or o.created_at<=c.rejected_at)) then raise exception 'New upload required after rejection'; end if;
 insert into public.claim_evidence(claim_id,uploaded_by,storage_path,evidence_type,note) values(cid,p.id,path,kind,coalesce(note_text,'')) returning id into eid;
 perform private.log_event(p,'EVIDENCE_UPLOADED','claim',cid,jsonb_build_object('evidenceId',eid,'type',kind));
 return eid;
end $$;
create function public.record_evidence(cid uuid,path text,kind text,note_text text default '') returns uuid language sql security invoker set search_path='' as $$ select private.record_evidence(cid,path,kind,note_text) $$;

create function private.mark_notifications_read() returns void language plpgsql security definer set search_path='' as $$
begin perform private.current_profile(); update public.notifications set read_at=now() where user_id=auth.uid() and read_at is null; end $$;
create function public.mark_notifications_read() returns void language sql security invoker set search_path='' as $$ select private.mark_notifications_read() $$;
create function public.server_today() returns date language sql stable set search_path='' as $$ select (now() at time zone 'Asia/Aqtau')::date $$;

-- RPC internals are outside exposed schemas. Only named, authenticated entrypoints are executable.
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.current_profile(),private.is_staff(),private.owns_contractor(uuid),private.can_claim(uuid),private.can_upload(text),private.can_read_file(text),private.submit_defect(uuid,text,text,text,text,uuid),private.transition_claim(uuid,text,text),private.record_evidence(uuid,text,text,text),private.mark_notifications_read() to authenticated;
revoke all on function public.submit_defect(uuid,text,text,text,text,uuid),public.transition_claim(uuid,text,text),public.record_evidence(uuid,text,text,text),public.mark_notifications_read(),public.server_today(),public.claim_sla(text,timestamptz,timestamptz) from public,anon;
grant execute on function public.submit_defect(uuid,text,text,text,text,uuid),public.transition_claim(uuid,text,text),public.record_evidence(uuid,text,text,text),public.mark_notifications_read(),public.server_today(),public.claim_sla(text,timestamptz,timestamptz) to authenticated;

create function private.save_registry(kind text, eid uuid, payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare p public.profiles; result_id uuid; org_id uuid; aid uuid; cid uuid; start_day date; end_day date; is_new boolean:=eid is null; field text;
begin
 p:=private.current_profile(); if p.role<>'ADMIN' then raise exception 'Permission denied: admin required'; end if;
 if kind is null or kind not in ('assets','contractors','contracts','warranties') then raise exception 'Invalid registry'; end if;
 if jsonb_typeof(payload)<>'object' or length(payload::text)>16000 then raise exception 'Invalid input'; end if;
 foreach field in array case kind when 'assets' then array['name','asset_code','asset_type','microdistrict','address','contract_id','commissioned_at'] when 'contractors' then array['name','bin_or_demo_identifier'] when 'contracts' then array['title','contract_number','contractor_id','start_date','completion_date'] else array['asset_id','contractor_id','starts_at','expires_at','terms'] end loop
 if length(trim(coalesce(payload->>field,'')))=0 or length(payload->>field)>5000 then raise exception 'Invalid field: %',field; end if; end loop;
 result_id:=coalesce(eid,gen_random_uuid());
 if not is_new then
   execute format('select id from public.%I where id=$1 for update',kind) into result_id using eid;
   if result_id is null then raise exception 'Record not found'; end if;
 end if;
 if kind='contractors' then
   if is_new then insert into public.organizations(name,type) values(trim(payload->>'name'),'CONTRACTOR') returning id into org_id;
   else select organization_id into org_id from public.contractors where id=eid; update public.organizations set name=trim(payload->>'name') where id=org_id; end if;
   insert into public.contractors(id,organization_id,name,bin_or_demo_identifier,contact_name,contact_phone) values(result_id,org_id,trim(payload->>'name'),trim(payload->>'bin_or_demo_identifier'),coalesce(payload->>'contact_name',''),coalesce(payload->>'contact_phone',''))
   on conflict(id) do update set name=excluded.name,bin_or_demo_identifier=excluded.bin_or_demo_identifier,contact_name=excluded.contact_name,contact_phone=excluded.contact_phone;
 elsif kind='contracts' then
   cid:=(payload->>'contractor_id')::uuid;
   if not is_new and exists(select 1 from public.assets where contract_id=eid) and exists(select 1 from public.contracts where id=eid and contractor_id<>cid) then raise exception 'Cannot change contractor of a contract with assets'; end if;
   insert into public.contracts(id,contract_number,contractor_id,title,start_date,completion_date,description) values(result_id,trim(payload->>'contract_number'),cid,trim(payload->>'title'),(payload->>'start_date')::date,(payload->>'completion_date')::date,coalesce(payload->>'description',''))
   on conflict(id) do update set contract_number=excluded.contract_number,contractor_id=excluded.contractor_id,title=excluded.title,start_date=excluded.start_date,completion_date=excluded.completion_date,description=excluded.description;
 elsif kind='assets' then
   cid:=(payload->>'contract_id')::uuid;
   if not is_new and exists(select 1 from public.warranties where asset_id=eid) and exists(select 1 from public.assets where id=eid and contract_id<>cid) then raise exception 'Cannot change contract of asset with warranties'; end if;
   insert into public.assets(id,name,asset_code,asset_type,microdistrict,address,contract_id,commissioned_at,description,latitude,longitude) values(result_id,trim(payload->>'name'),trim(payload->>'asset_code'),payload->>'asset_type',trim(payload->>'microdistrict'),trim(payload->>'address'),cid,(payload->>'commissioned_at')::date,coalesce(payload->>'description',''),nullif(payload->>'latitude','')::numeric,nullif(payload->>'longitude','')::numeric)
   on conflict(id) do update set name=excluded.name,asset_code=excluded.asset_code,asset_type=excluded.asset_type,microdistrict=excluded.microdistrict,address=excluded.address,contract_id=excluded.contract_id,commissioned_at=excluded.commissioned_at,description=excluded.description,latitude=excluded.latitude,longitude=excluded.longitude;
 else
   aid:=(payload->>'asset_id')::uuid; cid:=(payload->>'contractor_id')::uuid; start_day:=(payload->>'starts_at')::date; end_day:=(payload->>'expires_at')::date;
   perform 1 from public.assets where id=aid for update;
   if end_day<start_day then raise exception 'Invalid warranty dates'; end if;
   if not exists(select 1 from public.assets a join public.contracts c on c.id=a.contract_id where a.id=aid and c.contractor_id=cid and a.commissioned_at<=start_day) then raise exception 'Warranty contractor or start date does not match asset contract'; end if;
   if exists(select 1 from public.warranties w where w.asset_id=aid and w.id<>result_id and w.status='ACTIVE' and w.starts_at<=end_day and w.expires_at>=start_day) then raise exception 'Warranty dates overlap an existing warranty'; end if;
   if not is_new and exists(select 1 from public.warranty_claims where warranty_id=eid) and exists(select 1 from public.warranties where id=eid and (asset_id<>aid or contractor_id<>cid)) then raise exception 'Cannot reassign warranty with claims'; end if;
   insert into public.warranties(id,asset_id,contractor_id,starts_at,expires_at,terms) values(result_id,aid,cid,start_day,end_day,trim(payload->>'terms'))
   on conflict(id) do update set asset_id=excluded.asset_id,contractor_id=excluded.contractor_id,starts_at=excluded.starts_at,expires_at=excluded.expires_at,terms=excluded.terms;
 end if;
 perform private.log_event(p,case when not is_new then 'REGISTRY_UPDATED' when kind='assets' then 'ASSET_CREATED' when kind='warranties' then 'WARRANTY_CREATED' when kind='contracts' then 'CONTRACT_CREATED' else 'CONTRACTOR_CREATED' end,kind,result_id,payload);
 return result_id;
end $$;
create function public.save_registry(kind text,eid uuid,payload jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.save_registry(kind,eid,payload) $$;
revoke all on function private.save_registry(text,uuid,jsonb),public.save_registry(text,uuid,jsonb) from public,anon;
grant execute on function private.save_registry(text,uuid,jsonb),public.save_registry(text,uuid,jsonb) to authenticated;

create function private.refresh_sla() returns void language plpgsql security definer set search_path='' as $$
declare p public.profiles; c public.warranty_claims; stage text;
begin
 p:=private.current_profile();
 for c in select * from public.warranty_claims where public.claim_sla(status,response_deadline,repair_deadline)='OVERDUE' and (private.is_staff() or private.owns_contractor(contractor_id)) for update skip locked loop
 stage:=case when c.status='OPEN' then 'response' else 'repair' end;
 if not exists(select 1 from public.audit_logs where entity_id=c.id and action='DEADLINE_MISSED' and metadata->>'stage'=stage) then
 perform private.log_event(p,'DEADLINE_MISSED','claim',c.id,jsonb_build_object('stage',stage,'detectedOnAccess',true));
 end if; end loop;
end $$;
create function public.refresh_sla() returns void language sql security invoker set search_path='' as $$ select private.refresh_sla() $$;
revoke all on function private.refresh_sla(),public.refresh_sla() from public,anon;
grant execute on function private.refresh_sla(),public.refresh_sla() to authenticated;

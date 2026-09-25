-- Read-time warranty calculations live in PostgreSQL, shared by all screens.
alter table public.warranties add constraint warranties_finite_dates check (isfinite(starts_at) and isfinite(expires_at));
alter table public.contracts add constraint contracts_finite_dates check (isfinite(start_date) and isfinite(completion_date));
alter table public.assets add constraint assets_finite_date check (isfinite(commissioned_at));
create view public.warranties_overview with(security_invoker=true) as
select w.*,
 case when w.status<>'ACTIVE' then 'NOT_FOUND' when w.starts_at>public.server_today() then 'SCHEDULED' when w.expires_at<public.server_today() then 'EXPIRED' else 'ACTIVE' end as computed_status,
 greatest(0,w.expires_at-public.server_today()) as remaining_days,
 least(100,greatest(0,(public.server_today()-w.starts_at)::numeric/greatest(1,w.expires_at-w.starts_at)*100)) as elapsed_percent
from public.warranties w;
revoke all on public.warranties_overview from public,anon,authenticated;
grant select on public.warranties_overview to authenticated;

-- 3 MiB leaves room for multipart metadata beneath Vercel's 4.5 MB request ceiling.
update storage.buckets set file_size_limit=3145728 where id='claim-evidence';
create or replace function private.record_evidence(cid uuid, path text, kind text, note_text text) returns uuid language plpgsql security definer set search_path='' as $$
declare p public.profiles; eid uuid;
begin
 p:=private.current_profile();
 perform 1 from public.warranty_claims where id=cid for update;
 if split_part(path,'/',1)<>cid::text or not private.can_upload(path) then raise exception 'Permission denied: upload'; end if;
 if kind is null or kind not in ('BEFORE','AFTER') or length(coalesce(note_text,''))>2000 then raise exception 'Invalid evidence metadata'; end if;
 if not exists(select 1 from storage.objects where bucket_id='claim-evidence' and name=path and owner_id=p.id::text and (metadata->>'size')::bigint between 1 and 3145728 and metadata->>'mimetype' in ('image/jpeg','image/png','image/webp')) then raise exception 'Uploaded evidence file not found or invalid'; end if;
 if exists(select 1 from public.warranty_claims c join storage.objects o on o.bucket_id='claim-evidence' and o.name=path where c.id=cid and c.rejected_at is not null and (o.created_at is null or o.created_at<=c.rejected_at)) then raise exception 'New upload required after rejection'; end if;
 insert into public.claim_evidence(claim_id,uploaded_by,storage_path,evidence_type,note) values(cid,p.id,path,kind,coalesce(note_text,'')) returning id into eid;
 perform private.log_event(p,'EVIDENCE_UPLOADED','claim',cid,jsonb_build_object('evidenceId',eid,'type',kind));
 return eid;
end $$;

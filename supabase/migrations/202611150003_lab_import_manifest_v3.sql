-- Sprint 6.8-I metadata-only document index. Does not store original PDF bytes.
create table if not exists public.lab_import_manifest (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 sample_date date not null,
 original_filename text not null check(length(original_filename) between 1 and 180),
 lab_name text,
 reviewed_count integer not null check(reviewed_count between 1 and 80),
 confirmed_count integer not null check(confirmed_count between 0 and 80),
 pending_count integer not null check(pending_count between 0 and 80),
 excluded_count integer not null check(excluded_count between 0 and 80),
 created_at timestamptz not null default now(),
 unique(user_id,sha256,sample_date),
 check(lab_name is null or length(lab_name)<=120),
 check(reviewed_count=confirmed_count+pending_count+excluded_count)
);
create index if not exists lab_import_manifest_by_owner_date on public.lab_import_manifest(user_id,sample_date desc);
alter table public.lab_import_manifest enable row level security;
revoke all on public.lab_import_manifest from public,anon,authenticated;
grant select,insert on public.lab_import_manifest to authenticated;
drop policy if exists lab_import_manifest_owner_read on public.lab_import_manifest;
create policy lab_import_manifest_owner_read on public.lab_import_manifest for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists lab_import_manifest_owner_insert on public.lab_import_manifest;
create policy lab_import_manifest_owner_insert on public.lab_import_manifest for insert to authenticated with check ((select auth.uid())=user_id);

CREATE OR REPLACE FUNCTION public.save_lab_review_v3(p_rows jsonb, p_observed_on date, p_sha256 text, p_filename text, p_lab_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
 v_user uuid:=auth.uid();
 v_result jsonb;
 v_id uuid;
 v_filename text;
 v_lab_name text;
 v_confirmed integer;
 v_pending integer;
 v_excluded integer;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 v_filename:=nullif(trim(p_filename),'');
 v_lab_name:=nullif(trim(p_lab_name),'');
 if v_filename is null or length(v_filename)>180 or lower(v_filename) not like '%.pdf' then raise exception 'INVALID_FILENAME'; end if;
 if v_lab_name is not null and length(v_lab_name)>120 then raise exception 'INVALID_LAB_NAME'; end if;
 if p_rows is null or jsonb_typeof(p_rows)<>'array' then raise exception 'INVALID_ROWS'; end if;
 select count(*) filter(where row->>'decision'='confirmed'),
        count(*) filter(where row->>'decision'='deferred'),
        count(*) filter(where row->>'decision'='excluded')
 into v_confirmed,v_pending,v_excluded
 from jsonb_array_elements(p_rows) as r(row);
 -- This call, and metadata insert, run in one PostgreSQL statement transaction.
 v_result:=public.save_lab_review_v2(p_rows,p_observed_on,p_sha256);
 insert into public.lab_import_manifest(user_id,sha256,sample_date,original_filename,lab_name,
 reviewed_count,confirmed_count,pending_count,excluded_count)
 values(v_user,p_sha256,p_observed_on,v_filename,v_lab_name,jsonb_array_length(p_rows),v_confirmed,v_pending,v_excluded)
 on conflict(user_id,sha256,sample_date) do nothing
 returning id into v_id;
 if v_id is null then
   select id into v_id from public.lab_import_manifest
   where user_id=v_user and sha256=p_sha256 and sample_date=p_observed_on;
 end if;
 return v_result || jsonb_build_object('manifest_id',v_id);
end
$function$
;
revoke all on function public.save_lab_review_v3(jsonb,date,text,text,text) from public,anon;
grant execute on function public.save_lab_review_v3(jsonb,date,text,text,text) to authenticated;

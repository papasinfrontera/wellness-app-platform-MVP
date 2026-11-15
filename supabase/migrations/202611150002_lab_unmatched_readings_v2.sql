-- Sprint 6.8-A: private pending laboratory readings, no medical values in source.
create table if not exists public.lab_unmatched_readings (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
 collected_on date not null,
 source_row integer not null check (source_row between 1 and 80),
 original_label text not null check (char_length(original_label) between 1 and 120),
 raw_value text not null check (char_length(raw_value) between 1 and 120),
 unit text not null default '' check (char_length(unit)<=40),
 kind text not null check (kind in ('unmapped','qualitative','complementary')),
 status text not null default 'pending' check (status='pending'),
 created_at timestamptz not null default now(),
 unique(user_id,document_sha256,collected_on,source_row)
);
create index if not exists lab_unmatched_readings_owner_idx on public.lab_unmatched_readings(user_id,created_at desc);
alter table public.lab_unmatched_readings enable row level security;
revoke all on public.lab_unmatched_readings from public,anon,authenticated;
grant select,insert on public.lab_unmatched_readings to authenticated;
drop policy if exists lab_unmatched_owner_read on public.lab_unmatched_readings;
drop policy if exists lab_unmatched_owner_insert on public.lab_unmatched_readings;
create policy lab_unmatched_owner_read on public.lab_unmatched_readings for select to authenticated using ((select auth.uid())=user_id);
create policy lab_unmatched_owner_insert on public.lab_unmatched_readings for insert to authenticated with check ((select auth.uid())=user_id);

CREATE OR REPLACE FUNCTION public.save_lab_review_v2(p_rows jsonb, p_observed_on date, p_sha256 text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
 v_user uuid:=auth.uid();
 v_row jsonb;
 v_decision text;
 v_code text;
 v_original text;
 v_raw text;
 v_unit text;
 v_kind text;
 v_num numeric;
 v_indicator uuid;
 v_i integer:=0;
 v_n integer;
 v_count numeric;
 v_saved int:=0; v_dup int:=0; v_pending int:=0; v_pending_dup int:=0; v_ignored int:=0;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_observed_on is null or p_observed_on>current_date or p_observed_on<date '1900-01-01' then raise exception 'INVALID_DATE'; end if;
 if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_SHA256'; end if;
 if p_rows is null or jsonb_typeof(p_rows)<>'array' then raise exception 'INVALID_ROWS'; end if;
 v_n:=jsonb_array_length(p_rows);
 if v_n<1 or v_n>80 then raise exception 'INVALID_ROW_COUNT'; end if;
 for v_row in select value from jsonb_array_elements(p_rows) loop
   v_i:=v_i+1;
   if jsonb_typeof(v_row)<>'object' then raise exception 'INVALID_ROW %',v_i; end if;
   v_decision:=v_row->>'decision';
   if v_decision not in ('confirmed','deferred','excluded') or v_decision is null then raise exception 'INVALID_DECISION %',v_i; end if;
   if v_decision='excluded' then v_ignored:=v_ignored+1; continue; end if;
   v_original:=nullif(trim(v_row->>'original'),'');
   v_raw:=nullif(trim(v_row->>'value'),'');
   v_unit:=coalesce(trim(v_row->>'unit'),'');
   if v_original is null or length(v_original)>120 or v_raw is null or length(v_raw)>120 or length(v_unit)>40 then
     raise exception 'INVALID_READING %',v_i;
   end if;
   if v_decision='confirmed' then
     v_code:=v_row->>'code';
     if v_code is null or v_code !~ '^REF-[0-9]{3}$' or jsonb_typeof(v_row->'numeric_value')<>'number' then raise exception 'INVALID_CONFIRMATION %',v_i; end if;
     v_num:=(v_row->>'numeric_value')::numeric;
     if abs(v_num)>100000000000 or (v_unit='' and v_code<>'REF-028') then raise exception 'INVALID_NUMERIC_VALUE %',v_i; end if;
     select id into v_indicator from public.indicators where code=v_code;
     if v_indicator is null then raise exception 'UNKNOWN_CODE %',v_i; end if;
     insert into public.observations(user_id,indicator_id,observed_at,value,unit,origin,source_key,status,raw_label)
       values(v_user,v_indicator,(p_observed_on::timestamp at time zone 'UTC'),v_num,v_unit,'laboratory',
         p_sha256||':'||p_observed_on::text||':'||v_code,'approved',v_original)
       on conflict (user_id,origin,source_key) where source_key is not null do nothing;
     get diagnostics v_count=row_count;
     v_saved:=v_saved+v_count; v_dup:=v_dup+1-v_count;
   else
     v_kind:=v_row->>'kind';
     if v_kind not in ('unmapped','qualitative','complementary') or v_kind is null then raise exception 'INVALID_KIND %',v_i; end if;
     insert into public.lab_unmatched_readings(user_id,document_sha256,collected_on,source_row,original_label,raw_value,unit,kind,status)
       values(v_user,p_sha256,p_observed_on,v_i,v_original,v_raw,v_unit,v_kind,'pending')
       on conflict(user_id,document_sha256,collected_on,source_row) do nothing;
     get diagnostics v_count=row_count;
     v_pending:=v_pending+v_count; v_pending_dup:=v_pending_dup+1-v_count;
   end if;
 end loop;
 return jsonb_build_object('confirmed_saved',v_saved,'confirmed_existing',v_dup,'pending_saved',v_pending,'pending_existing',v_pending_dup,'excluded',v_ignored,'total',v_n);
end
$function$
;
revoke all on function public.save_lab_review_v2(jsonb,date,text) from public,anon;
grant execute on function public.save_lab_review_v2(jsonb,date,text) to authenticated;

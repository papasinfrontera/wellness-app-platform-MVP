-- Sprint 6.6-B: atomic, user-owned laboratory import. No patient values included.
-- Execute in the linked isolated Wellness Supabase project after review.
begin;
grant insert on public.observations to authenticated;
drop policy if exists observations_import_own on public.observations;
create policy observations_import_own on public.observations for insert to authenticated
  with check ((select auth.uid()) = user_id and origin = 'laboratory' and status = 'approved' and source_key is not null);

create or replace function public.save_lab_review(p_rows jsonb, p_observed_on date, p_sha256 text)
returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
 v_user uuid := auth.uid();
 v_item jsonb;
 v_code text;
 v_original text;
 v_unit text;
 v_value numeric;
 v_indicator uuid;
 v_count integer := 0;
 v_inserted integer;
 v_total integer;
 v_idx integer := 0;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_observed_on is null or p_observed_on > current_date or p_observed_on < date '1900-01-01' then
   raise exception 'Invalid collection date';
 end if;
 if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'Invalid document fingerprint'; end if;
 if p_rows is null or jsonb_typeof(p_rows) <> 'array' then raise exception 'Expected result array'; end if;
 v_total := jsonb_array_length(p_rows);
 if v_total < 1 or v_total > 80 then raise exception 'Invalid result count'; end if;
 for v_item in select value from jsonb_array_elements(p_rows) loop
   v_idx := v_idx + 1;
   if jsonb_typeof(v_item) <> 'object' then raise exception 'Invalid row'; end if;
   v_code := v_item->>'code'; v_original := v_item->>'original'; v_unit := v_item->>'unit';
   if v_code is null or v_code !~ '^REF-[0-9]{3}$'
      or v_original is null or length(v_original) not between 1 and 120
      or v_unit is null or length(v_unit) > 40
      or (v_unit = '' and v_code <> 'REF-028')
      or jsonb_typeof(v_item->'value') <> 'number' then raise exception 'Invalid laboratory row'; end if;
   v_value := (v_item->>'value')::numeric;
   if abs(v_value) > 100000000000 then raise exception 'Invalid numeric magnitude'; end if;
   select id into v_indicator from public.indicators where code = v_code;
   if v_indicator is null then raise exception 'Unknown catalog indicator'; end if;
   insert into public.observations(user_id,indicator_id,observed_at,value,unit,origin,source_key,status,raw_label)
     values(v_user,v_indicator,(p_observed_on::timestamp at time zone 'UTC'),v_value,v_unit,'laboratory',
       p_sha256 || ':' || p_observed_on::text || ':' || v_code,'approved',v_original)
     on conflict (user_id,origin,source_key) where source_key is not null do nothing;
   get diagnostics v_inserted = row_count;
   v_count := v_count + v_inserted;
 end loop;
 return jsonb_build_object('submitted',v_total,'saved',v_count,'already_present',v_total-v_count);
end;
$$;
revoke all on function public.save_lab_review(jsonb,date,text) from public,anon;
grant execute on function public.save_lab_review(jsonb,date,text) to authenticated;
commit;

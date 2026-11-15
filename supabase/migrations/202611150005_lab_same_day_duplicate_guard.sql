-- 6.8-J: transactional duplicate prevention for laboratory readings.
-- Reject same indicator + sample date from a different document; never silently overwrite.
create or replace function public.block_lab_same_day_duplicate()
returns trigger language plpgsql security invoker set search_path=''
as $body$
begin
 if new.origin <> 'laboratory' or new.status <> 'approved' then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended(
   new.user_id::text || ':' || new.indicator_id::text || ':' ||
   (new.observed_at at time zone 'UTC')::date::text,0));
 if exists(
  select 1 from public.observations o
   where o.user_id=new.user_id and o.indicator_id=new.indicator_id
   and (o.observed_at at time zone 'UTC')::date=(new.observed_at at time zone 'UTC')::date
   and o.origin='laboratory' and o.status='approved'
   and o.source_key is distinct from new.source_key
 ) then
  raise exception using errcode='23505',message='POTENTIAL_DUPLICATE_SAME_DAY';
 end if;
 return new;
end
$body$;
revoke all on function public.block_lab_same_day_duplicate() from public,anon,authenticated;
drop trigger if exists trg_block_lab_same_day_duplicate on public.observations;
create trigger trg_block_lab_same_day_duplicate before insert on public.observations
for each row execute function public.block_lab_same_day_duplicate();

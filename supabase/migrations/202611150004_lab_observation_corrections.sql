-- Sprint 6.8-J: immutable, owner-private correction events.
-- Original observations remain unchanged. Effective values are selected by the UI.
create table if not exists public.lab_observation_corrections (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 observation_id uuid not null references public.observations(id) on delete restrict,
 corrected_value numeric not null check(abs(corrected_value)<=100000000000),
 corrected_unit text not null check(length(trim(corrected_unit)) between 1 and 40),
 reason text not null check(length(trim(reason)) between 10 and 500),
 created_at timestamptz not null default now(),
 constraint correction_not_nan check (corrected_value::text <> 'NaN'),
 constraint correction_not_infinite check (corrected_value::text not in ('Infinity','-Infinity'))
);
create index if not exists lab_corrections_owner_observation_idx
 on public.lab_observation_corrections(user_id,observation_id,created_at desc,id desc);
alter table public.lab_observation_corrections enable row level security;
revoke all on public.lab_observation_corrections from public,anon,authenticated;
grant select,insert on public.lab_observation_corrections to authenticated;
drop policy if exists lab_corrections_owner_select on public.lab_observation_corrections;
create policy lab_corrections_owner_select on public.lab_observation_corrections
 for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists lab_corrections_owner_insert on public.lab_observation_corrections;
create policy lab_corrections_owner_insert on public.lab_observation_corrections
 for insert to authenticated with check (
   (select auth.uid())=user_id
   and exists(select 1 from public.observations o
     where o.id=observation_id and o.user_id=(select auth.uid())
       and o.origin='laboratory' and o.status='approved')
 );
-- Immutable: only INSERT/SELECT granted, with no UPDATE or DELETE policies.

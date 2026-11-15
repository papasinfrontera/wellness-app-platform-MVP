-- Sprint 6.7. Owner-only, read-only reference intervals transcribed from uploaded reports.
-- Numeric lab results, patients, source checksums and document contents are deliberately NOT committed.
create table if not exists public.observation_reference_intervals (
  observation_id uuid primary key references public.observations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lower_bound numeric not null,
  upper_bound numeric not null,
  unit text not null,
  source_kind text not null default 'user_supplied_pdf' check (source_kind = 'user_supplied_pdf'),
  checked_against_pdf boolean not null default false,
  interpretation_scope text not null default 'laboratory_reference_only'
    check (interpretation_scope = 'laboratory_reference_only'),
  created_at timestamptz not null default now(),
  constraint valid_interval check (lower_bound <= upper_bound)
);
create index if not exists obs_reference_user_idx on public.observation_reference_intervals(user_id);
alter table public.observation_reference_intervals enable row level security;
revoke all on public.observation_reference_intervals from anon, authenticated;
grant select on public.observation_reference_intervals to authenticated;
drop policy if exists obs_reference_owner_read on public.observation_reference_intervals;
create policy obs_reference_owner_read on public.observation_reference_intervals
 for select to authenticated
 using ((select auth.uid())=user_id and exists
 (select 1 from public.observations o where o.id=observation_id and o.user_id=(select auth.uid())));
comment on table public.observation_reference_intervals is
'Reference intervals from patient-supplied reports only; not optimal/diagnostic thresholds.';

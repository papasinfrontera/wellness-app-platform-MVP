-- Sprint 6.2: dedicated synthetic-data persistence sandbox.
-- Not a clinical table; never store patient results here.
create table if not exists public.demo_measurements (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 label text not null check (char_length(label) between 1 and 80),
 value numeric not null check (value between -100000 and 100000),
 unit text not null check (char_length(unit) between 1 and 16),
 created_at timestamptz not null default now()
);
create index if not exists demo_measurements_user_date on public.demo_measurements(user_id,created_at desc);
alter table public.demo_measurements enable row level security;
revoke all on public.demo_measurements from anon;
grant select,insert,delete on public.demo_measurements to authenticated;
create policy demo_measurements_read_own on public.demo_measurements
 for select to authenticated using ((select auth.uid()) = user_id);
create policy demo_measurements_insert_own on public.demo_measurements
 for insert to authenticated with check ((select auth.uid()) = user_id);
create policy demo_measurements_delete_own on public.demo_measurements
 for delete to authenticated using ((select auth.uid()) = user_id);
comment on table public.demo_measurements is 'Technical QA only: synthetic non-clinical test measurements. No real health data.';

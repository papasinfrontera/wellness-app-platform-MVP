-- WELLNESS APP Sprint 6.2 — draft migration for Supabase PostgreSQL
-- Apply ONLY after a security review in an isolated Supabase project.
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto;
create extension if not exists vector with schema extensions;
create table if not exists public.user_profiles (user_id uuid primary key references auth.users(id) on delete cascade, display_name text, timezone text not null default 'UTC', created_at timestamptz not null default now());
create table if not exists public.indicators (id uuid primary key default gen_random_uuid(), code text not null unique, name_es text not null, canonical_unit text, loinc_code text, is_calculated boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.documents (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,kind text not null check(kind in ('laboratory_pdf','whoop_export')),storage_path text not null,sha256 text,original_filename text,mime_type text,uploaded_at timestamptz not null default now(),unique(user_id,storage_path));
create table if not exists public.observations (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,indicator_id uuid not null references public.indicators(id),document_id uuid references public.documents(id) on delete set null,observed_at timestamptz not null,value numeric not null,unit text not null,origin text not null check(origin in ('laboratory','wearable','calculated','manual')),source_key text,status text not null default 'pending_review' check(status in ('pending_review','approved','rejected')),raw_label text,created_at timestamptz not null default now());
create unique index if not exists observations_source_dedupe on public.observations(user_id,origin,source_key) where source_key is not null;
create index if not exists observations_timeline_idx on public.observations(user_id,indicator_id,observed_at desc);
create table if not exists public.whoop_records (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,document_id uuid references public.documents(id) on delete set null,kind text not null check(kind in ('cycle','sleep','recovery','workout','journal')),external_key text not null,started_at timestamptz,ended_at timestamptz,payload jsonb not null,created_at timestamptz not null default now(),unique(user_id,kind,external_key));
create table if not exists public.import_jobs (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,document_id uuid references public.documents(id) on delete set null,kind text not null check(kind in ('laboratory_pdf','whoop_export')),status text not null default 'queued' check(status in ('queued','processing','needs_review','completed','failed')),error_code text,created_at timestamptz not null default now(),completed_at timestamptz);
create table if not exists public.evidence_sources (id uuid primary key default gen_random_uuid(),title text not null,source_url text,doi text,version text,license_note text,status text not null default 'candidate' check(status in ('candidate','under_review','approved','superseded')),approved_by uuid references auth.users(id),approved_at timestamptz,created_at timestamptz not null default now());
create table if not exists public.evidence_chunks (id uuid primary key default gen_random_uuid(),source_id uuid not null references public.evidence_sources(id) on delete cascade,section text,page_number integer,content text not null,embedding extensions.vector(1536),created_at timestamptz not null default now());
create index if not exists evidence_chunks_source_idx on public.evidence_chunks(source_id);
create table if not exists public.clinical_rules (id uuid primary key default gen_random_uuid(),rule_code text not null,version text not null,description text not null,definition jsonb not null,approved boolean not null default false,approved_at timestamptz,created_at timestamptz not null default now(),unique(rule_code,version));
create table if not exists public.audit_events (id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete set null,actor_id uuid references auth.users(id) on delete set null,event_type text not null,entity_type text not null,entity_id uuid,occurred_at timestamptz not null default now(),metadata jsonb not null default '{}'::jsonb);
alter table public.user_profiles enable row level security;
alter table public.indicators enable row level security;
alter table public.documents enable row level security;
alter table public.observations enable row level security;
alter table public.whoop_records enable row level security;
alter table public.import_jobs enable row level security;
alter table public.evidence_sources enable row level security;
alter table public.evidence_chunks enable row level security;
alter table public.clinical_rules enable row level security;
alter table public.audit_events enable row level security;
create policy profiles_select_own on public.user_profiles for select to authenticated using((select auth.uid()) = user_id);
create policy indicators_select_authenticated on public.indicators for select to authenticated using(true);
create policy documents_select_own on public.documents for select to authenticated using((select auth.uid()) = user_id);
create policy observations_select_own on public.observations for select to authenticated using((select auth.uid()) = user_id);
create policy whoop_select_own on public.whoop_records for select to authenticated using((select auth.uid()) = user_id);
create policy import_jobs_select_own on public.import_jobs for select to authenticated using((select auth.uid()) = user_id);
create policy evidence_sources_approved_select on public.evidence_sources for select to authenticated using(status='approved');
create policy evidence_chunks_approved_select on public.evidence_chunks for select to authenticated using(exists(select 1 from public.evidence_sources s where s.id=source_id and s.status='approved'));
create policy clinical_rules_approved_select on public.clinical_rules for select to authenticated using(approved=true);
-- All direct client writes remain DENIED; ingestion and approval must be validated by a privileged server operation.
-- No client access to audit_events. Further least-privilege grants and storage policies required before production.
commit;

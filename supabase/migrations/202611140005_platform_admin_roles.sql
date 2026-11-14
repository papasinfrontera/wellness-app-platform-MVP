-- Sprint 6.3-A: minimal admin role registry. No user may grant themselves a role.
create table if not exists public.platform_admin_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('super_admin','operations_admin','scientific_admin','support_admin')),
 is_active boolean not null default true,
 granted_at timestamptz not null default now(),
 granted_by uuid references auth.users(id),
 note text check(note is null or length(note)<=300)
);
alter table public.platform_admin_roles enable row level security;
revoke all on public.platform_admin_roles from anon,authenticated;
grant select on public.platform_admin_roles to authenticated;
create policy "admin_can_read_own_role" on public.platform_admin_roles for select to authenticated using(user_id=(select auth.uid()));
-- No insert, update or delete policies for application clients. Operator grants roles via audited privileged workflow only.
create table if not exists public.platform_admin_audit (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id),
 action text not null,
 target_type text,
 target_id text,
 reason text,
 created_at timestamptz not null default now()
);
alter table public.platform_admin_audit enable row level security;
revoke all on public.platform_admin_audit from anon,authenticated;
-- No client access to audit logs; administrative event writing requires future trusted server workflow.

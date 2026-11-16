-- Sprint 6.9-C2. Trusted backend only: check that an admin session still exists
-- and its owner is not currently banned. Never grant this function to public clients.
create or replace function public.admin_session_is_active(p_user_id uuid, p_session_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.sessions s
    join auth.users u on u.id = s.user_id
    where s.id = p_session_id and s.user_id = p_user_id
      and (s.not_after is null or s.not_after > now())
      and (u.banned_until is null or u.banned_until <= now())
  )
$$;
revoke all on function public.admin_session_is_active(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_session_is_active(uuid, uuid) to service_role;

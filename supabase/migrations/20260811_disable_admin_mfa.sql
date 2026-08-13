-- Compatibility migration retained by filename. Production policy now requires
-- a Supabase Auth session elevated to AAL2 with a verified MFA factor.
create or replace function public.has_admin_mfa()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid() is not null
    and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

revoke all on function public.has_admin_mfa() from public, anon;
grant execute on function public.has_admin_mfa() to authenticated;

comment on function public.has_admin_mfa() is
  'True only for an authenticated Supabase session verified at AAL2.';

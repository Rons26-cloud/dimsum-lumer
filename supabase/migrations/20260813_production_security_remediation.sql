-- Production security remediation.
-- Apply after every migration dated 2026-08-11 or earlier and after the legacy
-- zzzz_20260810 baseline. This file is the final authority for profile roles,
-- administrator MFA, and privileged profile policies.

begin;

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

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_can_manage boolean := public.is_superadmin() and public.has_admin_mfa();
  superadmin_count integer;
begin
  if tg_op = 'INSERT' then
    new.user_id := new.id;
    if not requester_can_manage then
      new.role := 'user';
      new.point := 0;
      new.member_level := 'Bronze';
    end if;
  elsif not requester_can_manage then
    new.role := old.role;
    new.point := old.point;
    new.member_level := old.member_level;
    new.user_id := old.user_id;
  elsif old.role = 'superadmin' and new.role is distinct from old.role then
    select count(*) into superadmin_count
    from public.profiles where role = 'superadmin';
    if superadmin_count <= 1 then
      raise exception 'Superadmin terakhir tidak dapat diturunkan';
    end if;
  end if;

  if new.role not in ('user', 'customer', 'admin', 'superadmin') then
    raise exception 'Role profil tidak valid';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.protect_profile_privileged_fields() from public, anon, authenticated;
drop trigger if exists protect_profile_privileged_fields_trigger on public.profiles;
create trigger protect_profile_privileged_fields_trigger
before insert or update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

-- Remove broad legacy policies. Owners retain the existing owner policies, but
-- the trigger freezes role, points, level, and identity for non-superadmins.
drop policy if exists admin_manage on public.profiles;
drop policy if exists "admin manage profiles" on public.profiles;
drop policy if exists admin_read_profiles on public.profiles;
drop policy if exists superadmin_manage_profiles on public.profiles;

create policy admin_read_profiles on public.profiles
for select to authenticated
using (public.is_admin());

create policy superadmin_manage_profiles on public.profiles
for all to authenticated
using (public.is_superadmin() and public.has_admin_mfa())
with check (public.is_superadmin() and public.has_admin_mfa());

create or replace function public.assert_superadmin_mfa()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Akses superadmin diperlukan';
  end if;
  if not public.has_admin_mfa() then
    raise exception 'Verifikasi MFA AAL2 diperlukan';
  end if;
end;
$$;

revoke all on function public.assert_superadmin_mfa() from public, anon, authenticated;

-- Keep executable application RPCs explicit and prevent future functions from
-- becoming callable by anon/public automatically.
alter default privileges in schema public revoke execute on functions from public, anon;

notify pgrst, 'reload schema';
commit;

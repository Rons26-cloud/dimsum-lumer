-- Every administrator is a separate Supabase Auth user. Authorization is
-- derived from protected database/app metadata and every sensitive action
-- requires that specific user's TOTP factor to elevate the session to AAL2.
begin;

set local lock_timeout = '30s';
set local statement_timeout = '2min';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'superadmin')
    );
$$;

create or replace function public.is_admin_aal2()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create or replace function public.is_superadmin_aal2()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin_aal2()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'superadmin'
    );
$$;

create or replace function public.assert_superadmin_mfa()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_superadmin_aal2() then
    raise exception using errcode = '42501', message = 'Superadmin MFA/AAL2 required';
  end if;
end;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin_aal2() from public;
revoke all on function public.is_superadmin_aal2() from public;
revoke all on function public.assert_superadmin_mfa() from public, anon;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_admin_aal2() to anon, authenticated;
grant execute on function public.is_superadmin_aal2() to anon, authenticated;
grant execute on function public.assert_superadmin_mfa() to authenticated;

-- Remove the historical, user-editable role claim. The trusted role remains
-- in raw_app_meta_data and public.profiles.
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'role',
    updated_at = now()
where coalesce(raw_user_meta_data, '{}'::jsonb) ? 'role';

create or replace function public.admin_promote_new_account(
  target_user_id uuid,
  admin_full_name text,
  admin_phone text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.profiles;
  target_email text;
begin
  perform public.assert_superadmin_mfa();

  select lower(email) into target_email
  from auth.users
  where id = target_user_id;

  if target_email is null then
    raise exception using errcode = '22023', message = 'Akun email autentikasi tidak ditemukan';
  end if;
  if length(trim(coalesce(admin_full_name, ''))) not between 3 and 80 then
    raise exception using errcode = '22023', message = 'Nama admin harus 3 sampai 80 karakter';
  end if;

  insert into public.profiles (id, user_id, full_name, phone, role, updated_at)
  values (target_user_id, target_user_id, trim(admin_full_name), nullif(trim(coalesce(admin_phone, '')), ''), 'admin', now())
  on conflict (id) do update set
    user_id = excluded.user_id,
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = 'admin',
    updated_at = now()
  returning * into result;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin'),
      raw_user_meta_data = (coalesce(raw_user_meta_data, '{}'::jsonb) - 'role')
        || jsonb_build_object(
          'full_name', trim(admin_full_name),
          'phone', nullif(trim(coalesce(admin_phone, '')), '')
        ),
      updated_at = now()
  where id = target_user_id and lower(email) = target_email;

  return result;
end;
$$;

revoke all on function public.admin_promote_new_account(uuid, text, text) from public, anon;
grant execute on function public.admin_promote_new_account(uuid, text, text) to authenticated;

-- Re-apply the final AAL2 gates even when an older migration created role-only
-- policies. These names are the control-plane policies used by this project.
drop policy if exists "admins manage non-APK config" on public.app_config;
create policy "admins manage non-APK config" on public.app_config
for all to authenticated
using (key <> 'apk_version' and public.is_admin_aal2())
with check (key <> 'apk_version' and public.is_admin_aal2());

drop policy if exists "superadmins manage APK config" on public.app_config;
create policy "superadmins manage APK config" on public.app_config
for all to authenticated
using (key = 'apk_version' and public.is_superadmin_aal2())
with check (key = 'apk_version' and public.is_superadmin_aal2());

drop policy if exists "admins manage non-APK control plane files" on storage.objects;
create policy "admins manage non-APK control plane files" on storage.objects
for all to authenticated
using (bucket_id in ('product-images','category-images','banners','store-photos') and public.is_admin_aal2())
with check (bucket_id in ('product-images','category-images','banners','store-photos') and public.is_admin_aal2());

drop policy if exists "superadmins manage APK" on storage.objects;
create policy "superadmins manage APK" on storage.objects
for all to authenticated
using (bucket_id = 'apk' and public.is_superadmin_aal2())
with check (bucket_id = 'apk' and public.is_superadmin_aal2());

alter default privileges in schema public revoke execute on functions from public, anon;
notify pgrst, 'reload schema';
commit;

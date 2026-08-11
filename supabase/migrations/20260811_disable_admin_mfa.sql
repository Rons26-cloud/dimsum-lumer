-- Dashboard admin kembali menggunakan email + password tanpa faktor MFA kedua.
-- Nama fungsi lama dipertahankan agar policy dan RPC yang sudah terpasang tetap
-- kompatibel. Role admin/superadmin masih wajib dan tetap diperiksa terpisah.
create or replace function public.has_admin_mfa()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid() is not null;
$$;

revoke all on function public.has_admin_mfa() from public, anon;
grant execute on function public.has_admin_mfa() to authenticated;

comment on function public.has_admin_mfa() is
  'Compatibility gate: MFA disabled; succeeds only for an authenticated session.';

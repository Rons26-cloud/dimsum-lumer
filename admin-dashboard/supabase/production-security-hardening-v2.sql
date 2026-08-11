-- Production security hardening v2 (password-only admin compatibility).
-- Apply after all existing dashboard migrations in Supabase SQL Editor.
-- This file is idempotent and is the final authority for admin privileges.
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

create or replace function public.has_admin_mfa()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  -- MFA is disabled in the dashboard. Keep this compatibility function because
  -- existing policies and RPCs call it; authentication and roles remain required.
  select auth.uid() is not null;
$$;

revoke all on function public.is_superadmin() from public, anon;
revoke all on function public.has_admin_mfa() from public, anon;
grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.has_admin_mfa() to authenticated;

-- A normal administrator may edit ordinary profile fields, but never role or
-- other privileged fields. This closes admin -> superadmin escalation.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_is_superadmin boolean := public.is_superadmin();
begin
  if tg_op = 'INSERT' then
    new.user_id := new.id;
    if not requester_is_superadmin then
      new.role := 'user';
      new.point := 0;
      new.member_level := 'Bronze';
    end if;
  elsif not requester_is_superadmin then
    new.role := old.role;
    new.point := old.point;
    new.member_level := old.member_level;
    new.user_id := old.user_id;
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

-- Remove the broad ALL policy from profiles. Admins can read profiles, while
-- only a superadmin can manage arbitrary profile records.
drop policy if exists admin_manage on public.profiles;
drop policy if exists admin_read_profiles on public.profiles;
drop policy if exists superadmin_manage_profiles on public.profiles;
create policy admin_read_profiles on public.profiles
for select to authenticated using (public.is_admin());
create policy superadmin_manage_profiles on public.profiles
for all to authenticated
using (public.is_superadmin() and public.has_admin_mfa())
with check (public.is_superadmin() and public.has_admin_mfa());

-- Sensitive administrator operations still require the superadmin role.
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
    raise exception 'Sesi admin tidak valid';
  end if;
end;
$$;
revoke all on function public.assert_superadmin_mfa() from public, anon, authenticated;

create or replace function public.admin_promote_new_account(
  target_user_id uuid, admin_full_name text, admin_phone text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare result public.profiles;
begin
  perform public.assert_superadmin_mfa();
  if target_user_id is null or not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'Akun autentikasi tidak ditemukan';
  end if;
  if length(trim(coalesce(admin_full_name, ''))) not between 3 and 80 then
    raise exception 'Nama admin harus 3 sampai 80 karakter';
  end if;
  insert into public.profiles (id,user_id,full_name,phone,role,updated_at)
  values (target_user_id,target_user_id,trim(admin_full_name),nullif(trim(coalesce(admin_phone,'')),''),'admin',now())
  on conflict (id) do update set full_name=excluded.full_name, phone=excluded.phone, role='admin', updated_at=now()
  returning * into result;
  update auth.users set
    raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||'{"role":"admin"}'::jsonb,
    raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('full_name',trim(admin_full_name),'phone',nullif(trim(coalesce(admin_phone,'')),'')),
    updated_at=now()
  where id=target_user_id;
  return result;
end;
$$;

create or replace function public.admin_delete_admin_account(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare target_role text; superadmin_count integer;
begin
  perform public.assert_superadmin_mfa();
  if target_user_id is null or target_user_id=auth.uid() then raise exception 'Akun target tidak valid'; end if;
  select role into target_role from public.profiles where id=target_user_id;
  if target_role not in ('admin','superadmin') then raise exception 'Akun administrator tidak ditemukan'; end if;
  if target_role='superadmin' then
    select count(*) into superadmin_count from public.profiles where role='superadmin';
    if superadmin_count<=1 then raise exception 'Superadmin terakhir tidak dapat dihapus'; end if;
  end if;
  delete from auth.users where id=target_user_id;
  if not found then raise exception 'Akun autentikasi tidak ditemukan'; end if;
  return target_user_id;
end;
$$;
revoke all on function public.admin_promote_new_account(uuid,text,text) from public, anon;
revoke all on function public.admin_delete_admin_account(uuid) from public, anon;
grant execute on function public.admin_promote_new_account(uuid,text,text) to authenticated;
grant execute on function public.admin_delete_admin_account(uuid) to authenticated;

-- Permanent customer deletion requires an authenticated admin session. Suspension remains available
-- to operational admins because it is reversible.
create or replace function public.admin_delete_customer(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare target_role text;
begin
  if not public.is_admin() or not public.has_admin_mfa() then raise exception 'Akses admin diperlukan'; end if;
  select role into target_role from public.profiles where id=target_user_id;
  if target_role is null then raise exception 'Pelanggan tidak ditemukan'; end if;
  if target_role in ('admin','superadmin') then raise exception 'Akun administrator dilindungi'; end if;
  delete from auth.users where id=target_user_id;
  return target_user_id;
end;
$$;
revoke all on function public.admin_delete_customer(uuid) from public, anon;
grant execute on function public.admin_delete_customer(uuid) to authenticated;

-- APK is executable software: only superadmins may mutate it.
drop policy if exists admin_manage_dashboard_files on storage.objects;
drop policy if exists superadmin_manage_apk_files on storage.objects;
create policy admin_manage_dashboard_files on storage.objects
for all to authenticated
using (bucket_id in ('product-images','category-images','banners') and public.is_admin())
with check (bucket_id in ('product-images','category-images','banners') and public.is_admin());
create policy superadmin_manage_apk_files on storage.objects
for all to authenticated
using (bucket_id = 'apk' and public.is_superadmin() and public.has_admin_mfa())
with check (bucket_id = 'apk' and public.is_superadmin() and public.has_admin_mfa());

alter table if exists public.apk_versions
  add column if not exists sha256 text,
  add column if not exists file_size bigint,
  add column if not exists uploaded_by uuid references auth.users(id);

drop policy if exists admin_read_activity_logs on public.activity_logs;
drop policy if exists superadmin_read_activity_logs on public.activity_logs;
create policy superadmin_read_activity_logs on public.activity_logs
for select to authenticated using (public.is_superadmin() and public.has_admin_mfa());

create or replace function public.redact_audit_json(payload jsonb)
returns jsonb
language sql
immutable
security invoker
set search_path = ''
as $$
  select coalesce(payload, '{}'::jsonb)
    - array['password','token','access_token','refresh_token','payment_proof_url',
            'shipping_address','address','phone','email','account_number','bank_account'];
$$;
revoke all on function public.redact_audit_json(jsonb) from public, anon;
grant execute on function public.redact_audit_json(jsonb) to authenticated;

create or replace function public.capture_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare row_id text; description text;
begin
  row_id := coalesce(case when tg_op='DELETE' then to_jsonb(old)->>'id' else to_jsonb(new)->>'id' end,'unknown');
  description := case tg_op when 'INSERT' then 'Menambahkan data baru' when 'UPDATE' then 'Memperbarui data' else 'Menghapus data' end||' pada '||tg_table_name;
  insert into public.activity_logs(admin_id,action,detail,entity_table,entity_id,old_data,new_data,created_at,occurred_at)
  values(
    auth.uid(),tg_op,description,tg_table_name,row_id,
    case when tg_op in ('UPDATE','DELETE') then public.redact_audit_json(to_jsonb(old)) end,
    case when tg_op in ('INSERT','UPDATE') then public.redact_audit_json(to_jsonb(new)) end,
    now(),now()
  );
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.capture_admin_audit() from public, anon, authenticated;

update public.activity_logs set
  old_data=case when old_data is null then null else public.redact_audit_json(old_data) end,
  new_data=case when new_data is null then null else public.redact_audit_json(new_data) end;

-- Ensure legacy SQL files cannot accidentally expose helpers to anonymous users.
alter default privileges in schema public revoke execute on functions from public, anon;
notify pgrst, 'reload schema';

-- Final enterprise security baseline. Run after every earlier migration.
-- This migration is intentionally idempotent and becomes the final authority
-- for privileged profile fields, administrator management, and payment proofs.

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

revoke all on function public.is_superadmin() from public, anon;
grant execute on function public.is_superadmin() to authenticated;

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_is_admin boolean := false;
begin
  if auth.uid() is not null then
    select coalesce(p.role in ('admin', 'superadmin'), false)
      into requester_is_admin
      from public.profiles p
      where p.id = auth.uid();
  end if;

  if tg_op = 'INSERT' then
    new.user_id := new.id;
    if not requester_is_admin then
      new.role := 'user';
      new.point := 0;
      new.member_level := 'Bronze';
    end if;
  elsif not requester_is_admin then
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
begin
  if not public.is_superadmin() then
    raise exception 'Akses superadmin diperlukan';
  end if;
  if target_user_id is null or not exists (
    select 1 from auth.users where id = target_user_id
  ) then
    raise exception 'Akun autentikasi tidak ditemukan';
  end if;
  if length(trim(coalesce(admin_full_name, ''))) not between 3 and 80 then
    raise exception 'Nama admin harus 3 sampai 80 karakter';
  end if;

  insert into public.profiles (id, user_id, full_name, phone, role, updated_at)
  values (
    target_user_id,
    target_user_id,
    trim(admin_full_name),
    nullif(trim(coalesce(admin_phone, '')), ''),
    'admin',
    now()
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = 'admin',
    updated_at = now()
  returning * into result;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object(
          'full_name', trim(admin_full_name),
          'phone', nullif(trim(coalesce(admin_phone, '')), '')
        ),
      updated_at = now()
  where id = target_user_id;
  return result;
end;
$$;

revoke all on function public.admin_promote_new_account(uuid, text, text) from public, anon;
grant execute on function public.admin_promote_new_account(uuid, text, text) to authenticated;

create or replace function public.admin_delete_admin_account(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
  superadmin_count integer;
begin
  if not public.is_superadmin() then
    raise exception 'Akses superadmin diperlukan';
  end if;
  if target_user_id is null or target_user_id = auth.uid() then
    raise exception 'Akun target tidak valid';
  end if;

  select role into target_role from public.profiles where id = target_user_id;
  if target_role not in ('admin', 'superadmin') then
    raise exception 'Akun administrator tidak ditemukan';
  end if;
  if target_role = 'superadmin' then
    select count(*) into superadmin_count
    from public.profiles where role = 'superadmin';
    if superadmin_count <= 1 then
      raise exception 'Superadmin terakhir tidak dapat dihapus';
    end if;
  end if;

  delete from auth.users where id = target_user_id;
  if not found then raise exception 'Akun autentikasi tidak ditemukan'; end if;
  return target_user_id;
end;
$$;

revoke all on function public.admin_delete_admin_account(uuid) from public, anon;
grant execute on function public.admin_delete_admin_account(uuid) to authenticated;

-- Payment proofs remain private and are tied to a pending order owned by user.
update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'application/pdf'
    ]
where id = 'payment-proofs';

drop policy if exists "users manage own payment proofs" on storage.objects;
drop policy if exists "users upload own payment proofs" on storage.objects;
drop policy if exists "users read own payment proofs" on storage.objects;
drop policy if exists "users delete own payment proofs" on storage.objects;
drop policy if exists "users delete own unsubmitted payment proofs" on storage.objects;
drop policy if exists "admins read payment proofs" on storage.objects;

create policy "users upload own payment proofs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and array_length(storage.foldername(name), 1) = 3
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'pdf')
  and exists (
    select 1 from public.orders o
    where o.id::text = (storage.foldername(name))[2]
      and o.user_id = auth.uid()
      and o.status = 'pending'
      and coalesce(o.payment_status, 'unpaid') in ('unpaid', 'failed')
  )
);

create policy "users read own payment proofs"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete own unsubmitted payment proofs"
on storage.objects for delete to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.orders o
    where o.id::text = (storage.foldername(name))[2]
      and o.user_id = auth.uid()
      and o.status = 'pending'
      and coalesce(o.payment_status, 'unpaid') in ('unpaid', 'failed')
  )
);

create policy "admins read payment proofs"
on storage.objects for select to authenticated
using (bucket_id = 'payment-proofs' and public.is_admin());

-- Functions are private by default; explicitly grant only application RPCs.
alter default privileges in schema public revoke execute on functions from public, anon;

notify pgrst, 'reload schema';

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
  perform public.assert_superadmin_mfa();
  if target_user_id is null or not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'Akun autentikasi tidak ditemukan';
  end if;
  if length(trim(coalesce(admin_full_name, ''))) < 3 then
    raise exception 'Nama admin minimal 3 karakter';
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
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
      raw_user_meta_data = (coalesce(raw_user_meta_data, '{}'::jsonb) - 'role') || jsonb_build_object('full_name', trim(admin_full_name), 'phone', nullif(trim(coalesce(admin_phone, '')), '')),
      updated_at = now()
  where id = target_user_id;
  return result;
end;
$$;

revoke all on function public.admin_promote_new_account(uuid, text, text) from public;
grant execute on function public.admin_promote_new_account(uuid, text, text) to authenticated;

create or replace function public.admin_delete_admin_account(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_role text;
  target_role text;
  superadmin_count integer;
begin
  perform public.assert_superadmin_mfa();
  if target_user_id is null then raise exception 'ID administrator tidak valid'; end if;
  if target_user_id = auth.uid() then raise exception 'Akun yang sedang digunakan tidak dapat menghapus dirinya sendiri'; end if;

  select role into requester_role from public.profiles where id = auth.uid();
  select role into target_role from public.profiles where id = target_user_id;
  if target_role is null or target_role not in ('admin', 'superadmin') then raise exception 'Akun administrator tidak ditemukan'; end if;
  if target_role = 'superadmin' and requester_role <> 'superadmin' then
    raise exception 'Hanya superadmin yang dapat menghapus akun superadmin';
  end if;
  if target_role = 'superadmin' then
    select count(*) into superadmin_count from public.profiles where role = 'superadmin';
    if superadmin_count <= 1 then raise exception 'Superadmin terakhir tidak dapat dihapus'; end if;
  end if;

  delete from auth.users where id = target_user_id;
  if not found then raise exception 'Akun tidak ditemukan di Supabase Auth'; end if;
  return target_user_id;
end;
$$;

revoke all on function public.admin_delete_admin_account(uuid) from public;
grant execute on function public.admin_delete_admin_account(uuid) to authenticated;
notify pgrst, 'reload schema';

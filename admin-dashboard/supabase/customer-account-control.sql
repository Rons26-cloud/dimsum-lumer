alter table public.profiles
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz;

create or replace function public.admin_set_customer_suspension(
  target_user_id uuid,
  should_suspend boolean,
  reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare target_profile public.profiles;
begin
  if not public.is_admin() then raise exception 'Akses admin diperlukan'; end if;
  select * into target_profile from public.profiles where id=target_user_id;
  if target_profile.id is null then raise exception 'Pelanggan tidak ditemukan'; end if;
  if target_profile.role in ('admin','superadmin') then raise exception 'Akun administrator dilindungi'; end if;

  update public.profiles set
    is_suspended=should_suspend,
    suspension_reason=case when should_suspend then nullif(trim(reason),'') else null end,
    suspended_at=case when should_suspend then now() else null end,
    updated_at=now()
  where id=target_user_id returning * into target_profile;

  update auth.users set
    banned_until=case when should_suspend then 'infinity'::timestamptz else null end,
    updated_at=now()
  where id=target_user_id;
  return target_profile;
end;
$$;

create or replace function public.admin_delete_customer(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare target_role text;
begin
  if not public.is_admin() then raise exception 'Akses admin diperlukan'; end if;
  select role into target_role from public.profiles where id=target_user_id;
  if target_role is null then raise exception 'Pelanggan tidak ditemukan'; end if;
  if target_role in ('admin','superadmin') then raise exception 'Akun administrator dilindungi'; end if;
  delete from auth.users where id=target_user_id;
  return target_user_id;
end;
$$;

-- Detail aman dari Supabase Auth untuk modal akun pelanggan. Kata sandi dan
-- token tidak pernah dikembalikan kepada dashboard.
create or replace function public.admin_get_customer_account(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'Akses admin diperlukan'; end if;
  if exists(select 1 from public.profiles where id=target_user_id and role in ('admin','superadmin')) then
    raise exception 'Akun administrator dilindungi';
  end if;
  select jsonb_build_object(
    'id', users.id,
    'email', users.email,
    'email_confirmed_at', users.email_confirmed_at,
    'phone', users.phone,
    'last_sign_in_at', users.last_sign_in_at,
    'created_at', users.created_at,
    'updated_at', users.updated_at,
    'providers', coalesce(users.raw_app_meta_data -> 'providers', '[]'::jsonb)
  ) into result from auth.users as users where users.id=target_user_id;
  if result is null then raise exception 'Akun pelanggan tidak ditemukan di Supabase Auth'; end if;
  return result;
end;
$$;

revoke all on function public.admin_set_customer_suspension(uuid,boolean,text) from public;
revoke all on function public.admin_delete_customer(uuid) from public;
revoke all on function public.admin_get_customer_account(uuid) from public;
grant execute on function public.admin_set_customer_suspension(uuid,boolean,text) to authenticated;
grant execute on function public.admin_delete_customer(uuid) to authenticated;
grant execute on function public.admin_get_customer_account(uuid) to authenticated;
notify pgrst, 'reload schema';

-- Canonical authentication/profile setup shared by Web and Flutter.
alter table public.profiles
  add column if not exists user_id uuid references auth.users(id),
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists role text default 'user',
  add column if not exists point integer default 0,
  add column if not exists member_level text default 'Bronze',
  add column if not exists updated_at timestamptz default now();

update public.profiles set user_id = id where user_id is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, user_id, full_name, phone, role, point, member_level, updated_at
  ) values (
    new.id,
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    'user',
    0,
    'Bronze',
    now()
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Prevent authenticated clients from granting themselves admin access or points.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
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
    if auth.uid() is not null and not requester_is_admin then
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

drop trigger if exists protect_profile_privileged_fields_trigger on public.profiles;
create trigger protect_profile_privileged_fields_trigger
before insert or update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

alter table public.profiles enable row level security;

drop policy if exists "cross platform own profile select" on public.profiles;
drop policy if exists "cross platform own profile insert" on public.profiles;
drop policy if exists "cross platform own profile update" on public.profiles;

create policy "cross platform own profile select"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "cross platform own profile insert"
on public.profiles for insert to authenticated
with check (auth.uid() = id and user_id = auth.uid());

create policy "cross platform own profile update"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id and user_id = auth.uid());

create unique index if not exists profiles_user_id_unique
on public.profiles(user_id) where user_id is not null;

notify pgrst, 'reload schema';

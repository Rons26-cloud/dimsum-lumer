-- Jalankan migration ini melalui Supabase SQL Editor atau Supabase CLI.
-- Authorization roles must not come from user-editable raw_user_meta_data.
-- dapat dikirim dan diubah oleh client.

alter table public.profiles
  alter column role set default 'user';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, full_name, phone, role)
  values (
    new.id,
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    'user'
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        phone = excluded.phone;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

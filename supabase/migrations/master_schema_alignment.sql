-- Penyelarasan schema Supabase dengan frontend Dimsum Lumer.
-- Jalankan file ini setelah master query awal melalui Supabase SQL Editor.

alter table public.profiles
  add column if not exists point integer default 0,
  add column if not exists member_level text default 'Bronze',
  add column if not exists role text default 'user',
  add column if not exists user_id uuid references auth.users(id),
  add column if not exists updated_at timestamptz default now();

update public.profiles set user_id = id where user_id is null;

alter table public.addresses
  add column if not exists recipient_name text,
  add column if not exists phone_number text,
  add column if not exists full_address text,
  add column if not exists city text,
  add column if not exists postal_code text,
  add column if not exists label text default 'Rumah',
  add column if not exists landmark text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists is_primary boolean default false,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_addresses_user_id on public.addresses(user_id);
create index if not exists idx_addresses_primary on public.addresses(user_id, is_primary);

alter table public.addresses enable row level security;
drop policy if exists "own addresses" on public.addresses;
drop policy if exists "Users can manage their own addresses" on public.addresses;
create policy "Users can manage their own addresses"
  on public.addresses for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.cart_items enable row level security;
drop policy if exists "Users can manage their own cart items" on public.cart_items;
create policy "Users can manage their own cart items"
  on public.cart_items for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.update_member_level()
returns trigger language plpgsql set search_path = public as $$
begin
  new.member_level := case
    when coalesce(new.point, 0) >= 700 then 'Platinum'
    when coalesce(new.point, 0) >= 300 then 'Gold'
    when coalesce(new.point, 0) >= 100 then 'Silver'
    else 'Bronze'
  end;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trigger_update_member_level on public.profiles;
create trigger trigger_update_member_level before insert or update of point on public.profiles
for each row execute function public.update_member_level();

create or replace function public.redeem_user_point()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_balance integer;
begin
  if new.point_used is null or new.point_used <= 0 then raise exception 'Jumlah poin tidak valid'; end if;
  select point into v_balance from public.profiles where id = new.user_id for update;
  if coalesce(v_balance, 0) < new.point_used then raise exception 'Poin tidak mencukupi'; end if;
  update public.profiles set point = point - new.point_used where id = new.user_id;
  insert into public.point_history(user_id, point, type, description)
  values(new.user_id, -new.point_used, 'redeem', 'Tukar reward');
  return new;
end;
$$;

drop trigger if exists trigger_redeem_point on public.reward_transactions;
create trigger trigger_redeem_point after insert on public.reward_transactions
for each row execute function public.redeem_user_point();

do $$
begin
  alter publication supabase_realtime add table public.addresses;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';

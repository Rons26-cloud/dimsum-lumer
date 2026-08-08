-- Menyamakan tabel addresses lama dengan kebutuhan checkout terbaru.
-- Aman dijalankan berulang kali melalui Supabase SQL Editor.
create table if not exists public.addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  recipient_name text,
  phone_number text,
  label text,
  phone text,
  full_address text not null,
  landmark text,
  latitude double precision,
  longitude double precision,
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.addresses add column if not exists label text;
alter table public.addresses add column if not exists recipient_name text;
alter table public.addresses add column if not exists phone_number text;
alter table public.addresses add column if not exists phone text;
alter table public.addresses add column if not exists full_address text;
alter table public.addresses add column if not exists city text;
alter table public.addresses add column if not exists postal_code text;
alter table public.addresses add column if not exists landmark text;
alter table public.addresses add column if not exists latitude double precision;
alter table public.addresses add column if not exists longitude double precision;
alter table public.addresses add column if not exists is_primary boolean default false;
alter table public.addresses add column if not exists created_at timestamptz default now();
alter table public.addresses add column if not exists updated_at timestamptz default now();

create index if not exists idx_addresses_user_id on public.addresses(user_id);
alter table public.addresses enable row level security;

drop policy if exists "own addresses" on public.addresses;
drop policy if exists "Users can manage their own addresses" on public.addresses;
create policy "own addresses" on public.addresses
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.addresses;
exception
  when duplicate_object then null;
end $$;

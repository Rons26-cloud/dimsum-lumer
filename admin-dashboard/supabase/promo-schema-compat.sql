create extension if not exists "uuid-ossp";

create table if not exists public.promos (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  code text,
  discount_type text default 'percentage',
  discount_value numeric(12,2) default 0,
  banner_url text,
  is_active boolean default true,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

alter table public.promos
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists code text,
  add column if not exists discount_type text default 'percentage',
  add column if not exists discount_value numeric(12,2) default 0,
  add column if not exists banner_url text,
  add column if not exists is_active boolean default true,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists created_at timestamptz default now();

update public.promos set
  title = coalesce(nullif(trim(title), ''), 'Promo Dimsum Lumer'),
  discount_type = coalesce(discount_type, 'percentage'),
  discount_value = coalesce(discount_value, 0),
  is_active = coalesce(is_active, true),
  created_at = coalesce(created_at, now());

alter table public.promos alter column title set not null;
create unique index if not exists promos_code_unique_idx
  on public.promos (upper(code)) where code is not null and trim(code) <> '';
create index if not exists promos_active_created_idx on public.promos(is_active, created_at desc);

alter table public.promos enable row level security;
drop policy if exists admin_manage on public.promos;
create policy admin_manage on public.promos for all to authenticated
  using (public.is_admin_aal2()) with check (public.is_admin_aal2());

do $$ begin
  alter publication supabase_realtime add table public.promos;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';

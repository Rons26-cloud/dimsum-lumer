create table if not exists public.flash_sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sale_price numeric(12,2) not null check (sale_price >= 0),
  original_price numeric(12,2) not null check (original_price >= sale_price),
  flash_stock integer not null default 0 check (flash_stock >= 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint flash_sale_valid_period check (ends_at > starts_at)
);

create index if not exists idx_flash_sales_active_period on public.flash_sales(is_active, starts_at, ends_at);
create unique index if not exists idx_flash_sales_one_active_product on public.flash_sales(product_id) where is_active = true;
alter table public.flash_sales enable row level security;

drop policy if exists "Public read active flash sales" on public.flash_sales;
create policy "Public read active flash sales" on public.flash_sales for select using (is_active = true or public.is_admin());
drop policy if exists "Admin manage flash sales" on public.flash_sales;
create policy "Admin manage flash sales" on public.flash_sales for all to authenticated using (public.is_admin_aal2()) with check (public.is_admin_aal2());

do $$ begin
  alter publication supabase_realtime add table public.flash_sales;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';

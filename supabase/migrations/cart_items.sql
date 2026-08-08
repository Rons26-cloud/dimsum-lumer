-- Keranjang tersinkron antardevice untuk pengguna yang sudah login.
create table if not exists cart_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  variant text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, product_id, variant)
);

create index if not exists idx_cart_items_user on cart_items(user_id);
alter table cart_items enable row level security;

drop policy if exists "own cart items" on cart_items;
create policy "own cart items" on cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

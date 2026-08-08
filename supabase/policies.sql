-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- Jalankan setelah database.sql & storage.sql
-- ============================================================

-- Aktifkan RLS di semua tabel utama
alter table profiles enable row level security;
alter table products enable row level security;
alter table categories enable row level security;
alter table stores enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_detail enable row level security;
alter table member_point enable row level security;
alter table point_history enable row level security;
alter table reward enable row level security;
alter table wishlist enable row level security;
alter table reviews enable row level security;
alter table promos enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;
alter table maintenance enable row level security;
alter table apk_versions enable row level security;
alter table store_settings enable row level security;

-- Helper: cek apakah user saat ini admin/superadmin
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$ language sql security definer;

-- ---------- PUBLIC READ (data katalog boleh dibaca siapa saja) ----------
create policy "public read products" on products for select using (true);
create policy "public read categories" on categories for select using (true);
create policy "public read stores" on stores for select using (true);
create policy "public read reward" on reward for select using (true);
create policy "public read reviews" on reviews for select using (true);
create policy "public read promos" on promos for select using (true);
create policy "public read maintenance" on maintenance for select using (true);
create policy "public read apk_versions" on apk_versions for select using (true);

-- ---------- ADMIN FULL ACCESS (write ke data katalog & operasional) ----------
create policy "admin manage products" on products for all using (is_admin()) with check (is_admin());
create policy "admin manage categories" on categories for all using (is_admin()) with check (is_admin());
create policy "admin manage stores" on stores for all using (is_admin()) with check (is_admin());
create policy "admin manage reward" on reward for all using (is_admin()) with check (is_admin());
create policy "admin manage promos" on promos for all using (is_admin()) with check (is_admin());
create policy "admin manage maintenance" on maintenance for all using (is_admin()) with check (is_admin());
create policy "admin manage apk_versions" on apk_versions for all using (is_admin()) with check (is_admin());
create policy "admin manage store_settings" on store_settings for all using (is_admin()) with check (is_admin());
create policy "admin read activity_logs" on activity_logs for select using (is_admin());
create policy "admin insert activity_logs" on activity_logs for insert with check (is_admin());
create policy "admin read all orders" on orders for select using (is_admin());
create policy "admin update all orders" on orders for update using (is_admin());
create policy "admin read all order_detail" on order_detail for select using (is_admin());
create policy "admin read all order items" on order_items for select using (is_admin());
create policy "admin read all profiles" on profiles for select using (is_admin());

-- ---------- OWNER-ONLY (data milik user sendiri) ----------
create policy "own profile select" on profiles for select using (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id);
create policy "own profile insert" on profiles for insert with check (auth.uid() = id);

create policy "own addresses" on addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own orders select" on orders for select using (auth.uid() = user_id);
create policy "own orders insert" on orders for insert with check (auth.uid() = user_id);
create policy "own order_detail select" on order_detail for select using (
  exists (select 1 from orders where orders.id = order_detail.order_id and orders.user_id = auth.uid())
);
create policy "own order_detail insert" on order_detail for insert with check (
  exists (select 1 from orders where orders.id = order_detail.order_id and orders.user_id = auth.uid())
);
create policy "own member_point" on member_point for select using (auth.uid() = user_id);
create policy "own point_history" on point_history for select using (auth.uid() = user_id);
create policy "own wishlist" on wishlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notifications" on notifications for select using (auth.uid() = user_id);
create policy "own notifications update" on notifications for update using (auth.uid() = user_id);

-- Review: siapa saja boleh menulis review atas namanya sendiri
create policy "own review insert" on reviews for insert with check (auth.uid() = user_id);

-- Defense in depth untuk seluruh tabel yang disentuh aplikasi customer.
-- Supabase/PostgREST menggunakan parameter binding, sehingga input tidak
-- digabung menjadi SQL mentah. RLS di bawah tetap menjadi batas otorisasi utama.

alter table if exists public.profiles enable row level security;
alter table if exists public.addresses enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.order_detail enable row level security;
alter table if exists public.order_items enable row level security;
alter table if exists public.cart_items enable row level security;
alter table if exists public.wishlist enable row level security;
alter table if exists public.notifications enable row level security;

drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "own notifications update" on public.notifications;
create policy "own notifications update" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Tidak izinkan client membuat order/detail secara langsung. Checkout harus
-- melalui RPC security-definer yang menghitung ulang harga dan stok di server.
drop policy if exists "own orders insert" on public.orders;
drop policy if exists "own order_detail insert" on public.order_detail;
drop policy if exists "own order items insert" on public.order_items;

-- Cegah role browser memanggil fungsi helper internal yang tidak diperlukan.
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

notify pgrst, 'reload schema';

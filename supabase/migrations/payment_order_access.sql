-- Pengguna dapat membaca pesanan dan item pesanan miliknya pada halaman
-- pembayaran, riwayat, pelacakan, serta struk. Admin tetap memakai policy admin.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "own orders select" on public.orders;
create policy "own orders select" on public.orders for select to authenticated
using(auth.uid()=user_id);

drop policy if exists "own order items select" on public.order_items;
create policy "own order items select" on public.order_items for select to authenticated
using(exists(select 1 from public.orders where orders.id=order_items.order_id and orders.user_id=auth.uid()));

notify pgrst, 'reload schema';

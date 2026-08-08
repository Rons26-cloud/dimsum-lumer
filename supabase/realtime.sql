-- ============================================================
-- REALTIME
-- Mengaktifkan replikasi realtime untuk tabel yang perlu update
-- otomatis di frontend-web / admin-dashboard / mobile-apk tanpa refresh.
-- ============================================================

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_detail;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table maintenance;
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table addresses;
alter publication supabase_realtime add table cart_items;

-- ============================================================
-- SEED DATA
-- Data contoh supaya frontend-web & admin-dashboard langsung
-- ada isinya saat pertama kali dijalankan.
-- ============================================================

insert into maintenance (target, is_active, message) values
  ('frontend-web', false, ''),
  ('mobile-apk', false, '')
on conflict (target) do nothing;

insert into store_settings (store_name, contact_email, contact_phone)
values ('Dimsum Lumer', 'admin@dimsumlumer.com', '6288807597952');

insert into stores (name, address, latitude, longitude, phone, open_time, close_time)
values ('Dimsum Lumer - Hongkong Fashion', 'Hongkong Fashion, Jalan Sisingamangaraja, Sudirejo II, Medan Amplas, Kota Medan, Sumatera Utara 20147', 3.570776, 98.694665, '6288807597952', '10:00', '22:00');

insert into categories (name, slug) values
  ('Goreng', 'goreng'),
  ('Kukus', 'kukus'),
  ('Minuman', 'minuman'),
  ('Frozen', 'frozen'),
  ('Lainnya', 'lainnya');

insert into products (category_id, name, slug, description, price, stock, sold_count)
select id, 'Dimsum Mozarella', 'dimsum-mozarella', 'Dimsum lumer isi keju mozarella premium.', 18000, 100, 166
from categories where slug = 'kukus'
union all
select id, 'Dimsum Ayam', 'dimsum-ayam', 'Dimsum ayam klasik dengan saus spesial.', 15000, 100, 132
from categories where slug = 'kukus'
union all
select id, 'Dimsum Udang', 'dimsum-udang', 'Dimsum isi udang segar pilihan.', 18000, 80, 98
from categories where slug = 'kukus'
union all
select id, 'Dimsum Mentai', 'dimsum-mentai', 'Dimsum lumer saus mentai gurih.', 20000, 60, 86
from categories where slug = 'goreng'
union all
select id, 'Dimsum Chicken Katsu', 'dimsum-chicken-katsu', 'Dimsum goreng crispy ala katsu.', 15000, 90, 72
from categories where slug = 'goreng';

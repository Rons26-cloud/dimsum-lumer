-- Tabel maintenance sudah dibuat di ../database.sql. File ini menyiapkan
-- baris default per target aplikasi (lihat juga ../seed.sql).
insert into maintenance (target, is_active, message) values
  ('frontend-web', false, ''),
  ('mobile-apk', false, '')
on conflict (target) do nothing;

-- Tabel maintenance sudah dibuat di ../database.sql. File ini menyiapkan
alter table maintenance add column if not exists start_time timestamptz;
alter table maintenance add column if not exists end_time timestamptz;

-- baris default per target aplikasi (lihat juga ../seed.sql).
insert into maintenance (target, is_active, message) values
  ('frontend-web', false, ''),
  ('mobile-apk', false, '')
on conflict (target) do nothing;

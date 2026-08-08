-- Referensi: struktur tabel profiles didefinisikan di ../database.sql
-- File ini menyimpan perubahan tambahan (index, dsb) untuk tabel profiles.
create index if not exists idx_profiles_role on profiles(role);

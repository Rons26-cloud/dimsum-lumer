-- ============================================================
-- STORAGE BUCKETS
-- Jalankan setelah database.sql
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('banners', 'banners', true),
  ('avatars', 'avatars', true),
  ('store-photos', 'store-photos', true),
  ('apk-builds', 'apk-builds', true)
on conflict (id) do nothing;

-- Semua bucket di atas bersifat public-read (gambar produk, banner, dsb boleh
-- diakses langsung lewat URL). Upload/ubah/hapus tetap dibatasi lewat policy
-- di storage.sql / policies.sql (hanya admin yang boleh menulis).

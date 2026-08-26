-- ============================================================
-- STORAGE BUCKETS
-- Jalankan setelah database.sql
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('banners', 'banners', true, 8388608, array['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('store-photos', 'store-photos', true, 8388608, array['image/jpeg','image/png','image/webp']),
  ('apk-builds', 'apk-builds', true, 209715200, array['application/vnd.android.package-archive','application/octet-stream'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Semua bucket di atas bersifat public-read (gambar produk, banner, dsb boleh
-- diakses langsung lewat URL). Upload/ubah/hapus tetap dibatasi lewat policy
-- di storage.sql / policies.sql (hanya admin yang boleh menulis).

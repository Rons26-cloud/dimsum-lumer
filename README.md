# Dimsum Lumer

Platform pemesanan dan operasional Dimsum Lumer yang terdiri dari aplikasi pelanggan, dashboard administrator, aplikasi Android, dan backend Supabase.

## Aplikasi

| Aplikasi | Teknologi | Fungsi |
| --- | --- | --- |
| `frontend-web` | React, Vite, Tailwind CSS, PWA | Katalog, keranjang, checkout, pembayaran, pesanan, poin, reward, notifikasi, dan akun pelanggan |
| `admin-dashboard` | React, Vite, Tailwind CSS, Recharts | Operasional toko, produk, promo, pesanan, pelanggan, reward, laporan, arsip, maintenance, dan rilis APK |
| `mobile-apk` | Flutter, Material 3, GoRouter | Aplikasi Android pelanggan dengan katalog, pesanan, akun, notifikasi, dan maintenance |
| `supabase` | PostgreSQL, Auth, Storage, Realtime, RLS | Database, autentikasi, penyimpanan, fungsi transaksi, policy, dan sinkronisasi real-time |

## Fitur Utama

- Autentikasi pelanggan dan administrator melalui Supabase Auth.
- Katalog produk, kategori, promo, flash sale, banner, dan rekomendasi.
- Keranjang dan checkout atomik dengan validasi harga serta stok di database.
- Pengiriman, lokasi pelanggan, bukti pembayaran, dan pembaruan status pesanan.
- Poin loyalitas, riwayat poin, reward, dan penukaran reward.
- Dashboard real-time dengan statistik, laporan, dan arsip bulanan.
- Pengelolaan pelanggan, status akun, keamanan login, dan audit tindakan admin.
- Maintenance terjadwal untuk web dan APK.
- PWA untuk frontend pelanggan dan build Android untuk aplikasi mobile.

## Struktur Repository

```text
Dimsum-lumer/
|-- frontend-web/       Aplikasi web pelanggan
|-- admin-dashboard/    Dashboard administrator
|-- mobile-apk/         Aplikasi Flutter
|-- supabase/           Skema dan migrasi publik
|-- design-packaging/   Aset konsep kemasan
`-- README.md
```

## Persyaratan

- Node.js 20 atau lebih baru.
- npm 10 atau lebih baru.
- Flutter SDK yang kompatibel dengan Dart `>=3.3.0 <4.0.0`.
- Project Supabase aktif.
- Browser modern dengan dukungan JavaScript module.
- HTTPS pada lingkungan produksi, terutama untuk GPS, PWA, dan service worker.

## Konfigurasi Environment

Jangan commit file `.env`. Repository hanya menyediakan nilai contoh.

### Frontend pelanggan

Buat `frontend-web/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_ADMIN_WA_NUMBER=62xxxxxxxxxxx
VITE_GOOGLE_MAPS_API_KEY=
VITE_GOOGLE_MAP_ID=
VITE_SELLER_NAME=DIMSUM LUMER
VITE_SELLER_BANK=BCA
VITE_SELLER_ACCOUNT=1234567890
VITE_SELLER_WALLET=08xxxxxxxxxx
VITE_SELLER_QRIS_IMAGE=
```

### Dashboard administrator

Buat `admin-dashboard/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_ADMIN_WA_NUMBER=62xxxxxxxxxxx
```

### Aplikasi Flutter

Buat `mobile-apk/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
ADMIN_WA_NUMBER=62xxxxxxxxxxx
APK_DOWNLOAD_HOSTS=downloads.example.com
```

Gunakan hanya Supabase anonymous/publishable key pada aplikasi klien. `service_role` hanya boleh disimpan pada server, Edge Function, atau secret CI yang tepercaya.

## Instalasi

### Frontend pelanggan

```bash
cd frontend-web
npm install
npm run dev
```

### Dashboard administrator

```bash
cd admin-dashboard
npm install
npm run dev
```

### Aplikasi Flutter

```bash
cd mobile-apk
flutter pub get
flutter run
```

## Database Supabase

File database publik tersedia di folder `supabase`:

```text
supabase/database.sql
supabase/migrations/
supabase/policies.sql
supabase/storage.sql
supabase/realtime.sql
supabase/seed.sql
supabase/security_post_deploy_check.sql
```

Gunakan project staging untuk menguji migrasi sebelum diterapkan ke produksi. Jalankan pemeriksaan pascadeploy setelah perubahan schema, fungsi, RLS, Storage, atau Realtime.

## Build Produksi

### Frontend pelanggan

```bash
cd frontend-web
npm run build
```

Hasil build tersedia di `frontend-web/dist`.

### Dashboard administrator

```bash
cd admin-dashboard
npm run build
```

Hasil build tersedia di `admin-dashboard/dist`.

### Android APK

```bash
cd mobile-apk
flutter build apk --release
```

Hasil build tersedia di `mobile-apk/build/app/outputs/flutter-apk`.

## Validasi

```bash
# Frontend
cd frontend-web
npm run build
npm run test:security

# Dashboard
cd ../admin-dashboard
npm run build

# Flutter
cd ../mobile-apk
dart analyze lib test
flutter test
```

## Deployment

- Deploy `frontend-web/dist` ke hosting frontend pelanggan.
- Deploy `admin-dashboard/dist` ke hosting dashboard yang terpisah.
- Konfigurasikan SPA fallback agar route React kembali ke `index.html`.
- Terapkan security headers dari masing-masing folder `public`.
- Simpan credential produksi pada environment hosting, bukan di repository.
- Distribusikan APK melalui Supabase Storage atau GitHub Releases, bukan sebagai file source repository.

### Urutan hardening keamanan produksi

1. Terapkan seluruh schema dan migrasi lama pada project staging.
2. Terapkan `supabase/migrations/zzzz_20260810_production_security_final.sql` bila baseline lama belum pernah diterapkan.
3. Terapkan `supabase/migrations/20260813_production_security_remediation.sql` paling akhir.
4. Aktifkan MFA TOTP pada Supabase Auth. Dashboard akan meminta setiap admin mendaftarkan atau memverifikasi authenticator setelah login.
5. Jalankan `supabase/security_post_deploy_check.sql` menggunakan sesi pengujian yang sesuai.
6. Uji akses dengan empat identitas terpisah: anon, pelanggan, admin, dan superadmin dengan AAL2.

Jangan menerapkan SQL dari `admin-dashboard/supabase`, `frontend-web/supabase/migrations`, atau `mobile-apk/security` secara acak pada produksi. Folder tersebut berisi modul atau baseline historis; migrasi root dan remediation terakhir adalah otoritas deployment.

## Keamanan

- Row Level Security harus aktif pada tabel yang diakses klien.
- Operasi sensitif dijalankan melalui fungsi database dengan pemeriksaan role.
- Bukti pembayaran disimpan pada bucket privat.
- File katalog publik tidak boleh berisi data pelanggan.
- Jangan menaruh password, private key, `service_role`, atau file `.env` di Git.
- Rotasi credential segera apabila pernah dibagikan atau terekspos.

## Status

Frontend pelanggan dan dashboard administrator berhasil melewati production build. Aplikasi Flutter berhasil melewati analisis kode untuk test terbaru. Validasi staging dan pengujian alur bisnis tetap wajib dilakukan sebelum deployment produksi.

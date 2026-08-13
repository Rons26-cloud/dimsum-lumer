# Dimsum Lumer Mobile

Aplikasi pelanggan Dimsum Lumer berbasis Flutter dan Supabase. Aplikasi
menyediakan katalog produk, keranjang, checkout, pesanan tamu, wishlist,
notifikasi, serta konfigurasi toko secara realtime.

## Persyaratan

- Flutter dengan Dart `>=3.3.0 <4.0.0`
- Android SDK untuk build Android
- Project Supabase yang sudah memiliki tabel dan RPC yang digunakan aplikasi

## Konfigurasi

Salin `.env.example` menjadi `.env`, lalu isi konfigurasi lokal:

```env
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=your-publishable-key
ADMIN_WA_NUMBER=628xxxxxxxxxx
```

Jangan commit `.env`. File tersebut sudah dikecualikan melalui `.gitignore`.
Gunakan hanya publishable/anonymous key pada aplikasi mobile; jangan pernah
menaruh service-role key di dalam APK.

## Menjalankan aplikasi

```powershell
flutter pub get
flutter run
```

Validasi proyek:

```powershell
dart format --output=none --set-exit-if-changed lib test
dart analyze lib test
flutter test
```

## Struktur

```text
lib/
├── config/       konfigurasi aplikasi
├── models/       model domain
├── router/       definisi navigasi
├── screens/      halaman berdasarkan fitur
├── security/     validasi input dan sanitasi error
├── services/     akses Supabase dan operasi bisnis
├── theme/        tema global
├── widgets/      widget bersama
└── main.dart     bootstrap aplikasi
```

SQL kebijakan keamanan dan petunjuk hardening Supabase tersedia di folder
`security/`.

## Keselarasan desain web dan APK

Halaman utama APK memuat frontend produksi dari
`https://dimsum-lumerr.pages.dev`. Karena itu, tampilan dan fitur yang sudah
dipublikasikan ke Cloudflare Pages langsung digunakan APK tanpa perlu menyalin
setiap halaman React menjadi layar Flutter terpisah.

URL dan domain yang dipercaya berada di `lib/config/app_config.dart`. Navigasi
utama dibatasi ke HTTPS pada domain tersebut; tautan WhatsApp, telepon, surel,
dan situs eksternal dibuka melalui aplikasi sistem. Permintaan lokasi WebView
hanya disetujui untuk domain frontend resmi setelah pengguna memberikan izin
Android.

Jika domain produksi berubah, perbarui `frontendUrl` dan `frontendHost`, lalu
bangun versi APK baru. Perubahan tampilan biasa cukup dipublikasikan ulang ke
Cloudflare Pages.

Login Google memakai OAuth Supabase melalui browser sistem dan kembali ke APK
melalui `io.dimsumlumer.app://login-callback/`. URL callback tersebut harus
terdaftar pada daftar Redirect URLs Supabase Auth. Provider Google juga harus
diaktifkan menggunakan Client ID dan Client Secret dari Google Cloud Console.

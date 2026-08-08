# Dimsum Lumer — Monorepo

Platform pemesanan dimsum yang terdiri dari website customer, dashboard admin,
aplikasi mobile, dan backend Supabase.

## Struktur proyek

```text
dimsum-lumer/
├── frontend-web/             # Website customer (React, Vite, Tailwind, PWA)
│   ├── public/               # Logo, favicon, dan manifest PWA
│   └── src/
│       ├── assets/           # Aset statis aplikasi
│       ├── components/       # Komponen antarmuka reusable
│       │   ├── cards/        # Kartu produk, kategori, promo, toko, ulasan
│       │   ├── checkout/     # Komponen modular proses checkout
│       │   ├── layout/       # Komponen layout dan preview perangkat
│       │   ├── location/     # Pemilih lokasi pelanggan
│       │   ├── maintenance/  # Guard dan halaman maintenance
│       │   ├── maps/         # Peta, marker, popup, rute, dan jarak
│       │   ├── navigation/   # Navbar, footer, breadcrumb, navigasi mobile
│       │   ├── review/       # Daftar ulasan pelanggan
│       │   └── ui/           # Button, input, modal, loading, toast, dll.
│       ├── hooks/            # State dan integrasi fitur React
│       ├── layouts/          # Layout utama, auth, checkout, dan profil
│       ├── pages/            # Halaman dan entry route customer
│       ├── router/           # Route publik, tamu, dan terproteksi
│       ├── sections/         # Bagian-bagian halaman Home
│       ├── services/         # Akses data per domain bisnis
│       ├── styles/           # CSS global, animasi, peta, scrollbar
│       ├── supabase/         # Client, auth, database, storage, realtime
│       └── theme/            # Token warna, tipografi, spacing, dll.
├── admin-dashboard/          # Panel admin (React, Vite, Tailwind, Recharts)
│   ├── public/               # Aset publik dashboard
│   └── src/
│       ├── assets/           # Logo dan aset dashboard
│       ├── components/       # UI dan navigasi admin
│       ├── hooks/            # Auth, statistik, dan live collection
│       ├── layouts/          # Layout autentikasi dan dashboard
│       ├── pages/            # Dashboard dan modul operasional
│       ├── router/           # Router dan proteksi admin
│       ├── services/         # Service produk, order, promo, laporan, dll.
│       ├── supabase/         # Client serta helper Supabase
│       ├── theme/            # Token tampilan dashboard
│       └── utils/            # Format tanggal dan mata uang
├── mobile-apk/               # Aplikasi Flutter
│   ├── assets/               # Logo aplikasi
│   └── lib/
│       ├── config/           # Konfigurasi aplikasi
│       ├── hooks/            # Tempat helper/state reusable
│       ├── models/           # Model data
│       ├── router/           # Navigasi GoRouter
│       ├── screens/          # Home, login, dan maintenance
│       ├── services/         # Auth, produk, dan Supabase
│       ├── theme/            # Tema Flutter
│       └── widgets/          # Tempat widget reusable
└── supabase/
    ├── migrations/           # Migrasi per domain/tabel
    ├── database.sql          # Skema database utama
    ├── policies.sql          # Row Level Security (RLS)
    ├── storage.sql           # Bucket dan policy storage
    ├── realtime.sql          # Konfigurasi realtime
    └── seed.sql              # Data awal pengembangan
```

Folder `hooks/` dan `widgets/` pada aplikasi mobile saat ini disiapkan untuk
pengembangan berikutnya dan belum berisi implementasi.

### Komponen checkout

Folder `frontend-web/src/components/checkout/` memecah halaman checkout menjadi
komponen berikut:

- `CheckoutHeader.jsx` — header checkout aman
- `CheckoutSteps.jsx` — indikator tahapan checkout
- `ReceiverSection.jsx` — data penerima
- `AddressSection.jsx` — alamat pengiriman
- `OrderSummarySection.jsx` — ringkasan item dan biaya pesanan
- `ShippingMethodSection.jsx` — pilihan metode pengiriman
- `PaymentMethodSection.jsx` — pilihan metode pembayaran
- `CheckoutModals.jsx` — kumpulan modal interaksi checkout

Seluruh komponen tersebut dirangkai dan digunakan oleh
`frontend-web/src/pages/Checkout.jsx`.

Checkout sudah responsif untuk layar mobile dan menggunakan action bar yang
tetap terlihat di bagian bawah. Data profil, alamat, serta keranjang pengguna
dipantau melalui Supabase Realtime. Geolocation memakai API lokasi perangkat,
dan tombol pemesanan menyimpan data ke tabel `orders` serta `order_detail`.

Alur checkout menggunakan `navigator.geolocation.watchPosition` untuk GPS live.
Alamat menyimpan label, nomor penerima, alamat lengkap, patokan, latitude, dan
longitude. Pembuatan order dijalankan oleh fungsi SQL `checkout_order_v2`
sebagai satu transaksi atomik: stok divalidasi, harga dihitung dari database,
data ditulis ke `orders` dan `order_items`, lalu keranjang server dibersihkan.
COD dan Transfer Bank dapat membuka draft order ke WhatsApp Admin sebelum user
diarahkan ke `/orders`. Halaman riwayat dan pelacakan memantau status order
secara realtime tanpa refresh. Halaman pelacakan juga dapat
menyinkronkan lokasi pengguna maksimal setiap lima detik melalui fungsi
`update_own_order_location`, dan status order diperbarui realtime tanpa refresh.

Untuk mengaktifkan checkout pada project Supabase yang sudah ada, jalankan secara
berurutan: `supabase/migrations/cart_items.sql`,
`supabase/migrations/checkout_realtime.sql`,
`supabase/migrations/checkout_v2.sql`, `supabase/policies.sql`, lalu
`supabase/realtime.sql`. Urutan ini mengaktifkan `cart_items`, `order_items`,
kolom order kompatibel, RLS, fungsi transaksi, dan publication realtime.
Geolocation browser hanya berfungsi pada HTTPS atau `localhost`, dan pengguna
tetap harus memberikan izin lokasi pada perangkat.

Checkout memakai tema terang merah-putih yang sama dengan aplikasi utama.
Pilihan pengiriman terdiri dari GoSend, GrabExpress, dan COD/Ambil Sendiri.
Metode pembayaran ditampilkan sebagai ikon ringkas; saat dipilih, detail rekening
atau akun penjual dibuka dalam popup. Nilai rekening diatur melalui
`VITE_SELLER_NAME`, `VITE_SELLER_BANK`, `VITE_SELLER_ACCOUNT`, dan
`VITE_SELLER_WALLET`, serta `VITE_SELLER_QRIS_IMAGE` (URL gambar QRIS penjual). Peta checkout menggunakan Leaflet/OpenStreetMap dan marker
bergerak mengikuti pembaruan GPS perangkat.

Halaman utama memakai tiga banner promo otomatis (`banner-mentai.png`,
`banner-family.png`, dan `banner-frozen.png`) dengan interval 4,5 detik. Slider
mendukung tombol desktop, indikator aktif, pause saat hover, dan swipe pada
perangkat sentuh. Gambar banner menggunakan runtime cache PWA agar instalasi awal
tetap ringan.

## Status implementasi

| Bagian | Status |
|---|---|
| Website customer | Halaman utama, produk, detail, keranjang, promo, lokasi, wishlist, checkout realtime responsif, pelacakan order, profil, poin, reward, auth, dan maintenance tersedia |
| PWA customer | Manifest, aset instalasi, layout responsif, dan konfigurasi service worker tersedia |
| Dashboard admin | Login, layout terproteksi, dashboard realtime, sidebar desktop, bottom navigation mobile, serta modul operasional tersedia |
| Route modul admin | Product, Promo, Order, Customer, Member, Store, Report, APK, dan Settings sudah aktif; modul tambahan memakai halaman persiapan |
| Aplikasi mobile | Navigation shell empat tab, katalog realtime, pesanan realtime, profil, auth, tema aplikasi, dan maintenance tersedia |
| Database | Skema inti, migrasi, RLS, storage, realtime, dan seed tersedia |

## Prasyarat

- Node.js 18+ dan npm
- Flutter SDK 3.3+ untuk aplikasi mobile
- Project Supabase beserta URL dan anonymous key

## Konfigurasi environment

Untuk website customer dan dashboard admin, salin `.env.example` ke masing-masing
folder aplikasi:

```bash
cp .env.example frontend-web/.env
cp .env.example admin-dashboard/.env
```

Isi nilainya:

```dotenv
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_WA_NUMBER=62xxxxxxxxxxx
```

`VITE_ADMIN_WA_NUMBER` hanya digunakan oleh website customer.

Untuk Flutter, buat `mobile-apk/.env` dengan nama variabel tanpa prefix `VITE_`:

```dotenv
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Jangan commit file `.env`; semua file tersebut sudah dicakup oleh `.gitignore`.

## Cara menjalankan

### Website customer

```bash
cd frontend-web
npm install
npm run dev
```

### Dashboard admin

```bash
cd admin-dashboard
npm install
npm run dev
```

### Aplikasi mobile

```bash
cd mobile-apk
flutter pub get
flutter run
```

## Menyiapkan database Supabase

Jalankan file SQL melalui Supabase SQL Editor dengan urutan berikut:

1. `supabase/database.sql`
2. Seluruh file dalam `supabase/migrations/`
3. `supabase/policies.sql`
4. `supabase/storage.sql`
5. `supabase/realtime.sql`
6. `supabase/seed.sql`

Periksa kembali ketergantungan antarmigrasi sebelum menjalankannya pada database
produksi.

## Build produksi

```bash
# Website customer
cd frontend-web
npm run build

# Dashboard admin
cd ../admin-dashboard
npm run build

# Android APK
cd ../mobile-apk
flutter build apk --release
```

Hasil build web berada di folder `dist/`, sedangkan APK Flutter berada di
`mobile-apk/build/app/outputs/flutter-apk/`.

## Pola tampilan aplikasi

- `frontend-web` menggunakan desain mobile-first, bottom navigation, safe area,
  action bar checkout, pencarian katalog, realtime badge, dan dukungan instalasi
  PWA.
- `mobile-apk` menggunakan Material 3 dengan navigation bar Beranda, Produk,
  Pesanan, dan Akun. Produk serta pesanan mengikuti perubahan Supabase secara
  realtime.
- `admin-dashboard` menggunakan sidebar pada desktop dan bottom navigation pada
  mobile. Konten memiliki padding safe area dan route operasional yang dapat
  dibuka langsung dari navigasi.

## Catatan repository

Salinan proyek ini tidak menyertakan metadata `.git`, sehingga folder baru tidak
dapat dibedakan secara otomatis melalui `git status`. Struktur di atas disusun
langsung dari folder dan source code yang tersedia saat dokumentasi diperbarui.

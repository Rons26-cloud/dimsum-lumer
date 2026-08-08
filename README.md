## Dimsum Lumer — Monorepo

Ini project lengkap yang aku bikin buat bisnis dimsum online. Isinya ada 4 bagian yang saling nyambung jadi satu ekosistem: website customer, dashboard admin, aplikasi mobile, sama backend Supabase.

## 📁 Struktur Proyek

Project ini dibagi jadi 4 folder utama ya we:

frontend-web/ — website customer, dibangun pakai React, Vite, Tailwind, dan udah support PWA. Di dalamnya kerapian foldernya lumayan niat: ada folder khusus buat komponen (kartu produk, checkout, layout, lokasi, maps, navigasi, review, UI reusable), hooks, layouts, pages, router, sections halaman Home, services per domain bisnis, styles, integrasi Supabase, sampe theme (token warna & tipografi) 🌐
admin-dashboard/ — panel admin, juga pakai React, Vite, Tailwind, plus Recharts buat grafik. Strukturnya mirip frontend-web tapi fokus ke kebutuhan operasional toko: dashboard, modul-modul admin, service produk/order/promo/laporan, dan utility format tanggal & mata uang 📊
mobile-apk/ — aplikasi Flutter, isinya konfigurasi aplikasi, model data, navigasi (GoRouter), screens (home, login, maintenance), services (auth, produk, Supabase), dan tema Flutter. Folder hooks/ dan widgets/ di sini masih disiapin buat pengembangan berikutnya dan belum ada implementasinya ya 🚧
supabase/ — backend-nya, isinya migrasi per domain/tabel, skema database utama, RLS (Row Level Security), konfigurasi storage & realtime, serta data awal (seed) buat pengembangan 🗄️
🎨 Tema & Tampilan

Dimsum Lumer pakai tema putih-oren 🧡 yang konsisten di semua bagian — dari header, tombol, sampe ikon aktif di navigasi bawah. Nuansanya hangat, cocok banget buat brand makanan.

Dari tampilan halaman utama, nanti kalian bakal liat:

Header — logo maskot + nama brand "Dimsum Lumer" warna oren, background putih bersih
Search bar — rounded, abu muda, ada ikon filter di kanan
Banner promo — background gelap kontras biar foto produk nonjol, tombol CTA "Pesan Sekarang" oren solid
Kategori — ikon bulat dengan border oren pas aktif
Kartu produk — putih bersih, ada badge harga & ikon favorit (love) di pojok
Bottom navigation — 5 tab (Beranda, Menu, Pesanan, Favorit, Profil), tab aktif ditandain warna oren, item tengah (Pesanan) dibikin menonjol pakai lingkaran hitam

Kesan keseluruhannya: clean, warm, appetizing — putih buat kesan bersih & modern, oren buat kesan hangat & menggugah selera yakan

## 🛒 Komponen Checkout

Folder frontend-web/src/components/checkout/ mecah halaman checkout jadi 8 komponen biar gampang aku maintain:

CheckoutHeader.jsx — header checkout aman
CheckoutSteps.jsx — indikator tahapan checkout
ReceiverSection.jsx — data penerima
AddressSection.jsx — alamat pengiriman
OrderSummarySection.jsx — ringkasan item dan biaya pesanan
ShippingMethodSection.jsx — pilihan metode pengiriman
PaymentMethodSection.jsx — pilihan metode pembayaran
CheckoutModals.jsx — kumpulan modal interaksi checkout

Semua komponen ini dirangkai dan dipakai oleh frontend-web/src/pages/Checkout.jsx.

Checkout udah responsif ya we buat layar mobile dan pakai action bar yang tetap keliatan di bagian bawah. Data profil, alamat, serta keranjang kalian dipantau lewat Supabase Realtime. Geolocation pakai API lokasi perangkat, dan tombol pemesanan nyimpen data ke tabel orders serta order_detail.

## ⚙️ Terus Alur teknis checkout

GPS live pakai navigator.geolocation.watchPosition, jadi lokasi ke-update terus selama checkout
Alamat nyimpen: label, nomor penerima, alamat lengkap, patokan, latitude, dan longitude
Pembuatan order dijalanin oleh fungsi SQL checkout_order_v2 sebagai satu transaksi atomik — stok divalidasi, harga dihitung dari database, data ditulis ke orders dan order_items, lalu keranjang server dibersihin. Kalau ada langkah gagal, semuanya batal, gak ada data nyangkut 🔒
COD dan Transfer Bank bisa buka draft order ke WhatsApp Admin sebelum kalian diarahin ke /orders
Halaman riwayat dan pelacakan memantau status order secara realtime tanpa refresh
Halaman pelacakan juga bisa nyinkronin lokasi kalian maksimal tiap 5 detik lewat fungsi update_own_order_location, dan status order ke-update realtime tanpa refresh 📍
💳 Pengiriman & pembayaran

Checkout pakai tema terang putih-oren yang sama dengan aplikasi utama. Pilihan pengiriman terdiri dari GoSend, GrabExpress, dan COD/Ambil Sendiri. Metode pembayaran ditampilin sebagai ikon ringkas — pas dipilih, detail rekening atau akun penjual kebuka dalam popup.

Nilai rekening diatur lewat environment variable:

VITE_SELLER_NAME
VITE_SELLER_BANK
VITE_SELLER_ACCOUNT
VITE_SELLER_WALLET
VITE_SELLER_QRIS_IMAGE   # URL gambar QRIS penjual

Peta checkout pakai Leaflet/OpenStreetMap dan marker-nya gerak ngikutin pembaruan GPS perangkat 🗺️

🔧 Cara mengaktifkan checkout

Terus buat ngaktifin checkout di project Supabase yang udah ada, jalanin berurutan ya we:

supabase/migrations/cart_items.sql
supabase/migrations/checkout_realtime.sql
supabase/migrations/checkout_v2.sql
supabase/policies.sql
supabase/realtime.sql

Urutan itu bakal ngaktifin cart_items, order_items, kolom order kompatibel, RLS, fungsi transaksi, dan publication realtime.

⚠️ Geolocation browser cuma jalan di HTTPS atau localhost, ya we  dan kalian tetap harus kasih izin lokasi di perangkat.

## 🏠 Halaman Utama

Halaman utama pakai tiga banner promo otomatis (banner-mentai.png, banner-family.png, dan banner-frozen.png) dengan interval 4,5 detik. Slider-nya mendukung tombol desktop, indikator aktif, pause saat hover, dan swipe di perangkat sentuh. Gambar banner pakai runtime cache PWA biar instalasi awal tetap ringan ⚡

## ✅ Status Implementasi Bagian	Status

🌐 Website customer	Halaman utama, produk, detail, keranjang, promo, lokasi, wishlist, checkout realtime responsif, pelacakan order, profil, poin, reward, auth, dan maintenance tersedia
##📲 PWA customer	Manifest, aset instalasi, layout responsif, dan konfigurasi service worker tersedia
📊 Dashboard admin	Login, layout terproteksi, dashboard realtime, sidebar desktop, bottom navigation mobile, serta modul operasional tersedia
🧩 Route modul admin	Product, Promo, Order, Customer, Member, Store, Report, APK, dan Settings sudah aktif; modul tambahan memakai halaman persiapan
📱 Aplikasi mobile	Navigation shell 5 tab (Beranda, Menu, Pesanan, Favorit, Profil), katalog realtime, pesanan realtime, profil, auth, tema aplikasi, dan maintenance tersedia
🗄️ Database	Skema inti, migrasi, RLS, storage, realtime, dan seed tersedia
🔧 Prasyarat
Node.js 18+ dan npm
Flutter SDK 3.3+ untuk aplikasi mobile
Project Supabase beserta URL dan anonymous key
⚙️ Konfigurasi Environment

Buat website customer dan dashboard admin, salin .env.example ke masing-masing folder aplikasi:

bash
cp .env.example frontend-web/.env
cp .env.example admin-dashboard/.env

Isi nilainya:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_WA_NUMBER=62xxxxxxxxxxx

(VITE_ADMIN_WA_NUMBER cuma dipakai oleh website customer aja)

Buat Flutter, bikin mobile-apk/.env dengan nama variabel tanpa prefix VITE_:

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

🚫 Oh ya jangan commit file .env ya — semua file itu udah dicakup sama .gitignore ya we.

## ▶️ Terus Cara Menjalankan

Website customer

bash
cd frontend-web
npm install
npm run dev

Dashboard admin

bash
cd admin-dashboard
npm install
npm run dev

Aplikasi mobile

bash
cd mobile-apk
flutter pub get
flutter run
🗄️ Menyiapkan Database Supabase

Jalankan file SQL lewat Supabase SQL Editor dengan urutan:

supabase/database.sql
Seluruh file dalam supabase/migrations/
supabase/policies.sql
supabase/storage.sql
supabase/realtime.sql
supabase/seed.sql

⚠️ Periksa kembali ketergantungan antarmigrasi sebelum menjalankannya di database produksi.

🏗️ Build Produksi
bash
# Website customer
cd frontend-web
npm run build

# Dashboard admin
cd ../admin-dashboard
npm run build

# Android APK
cd ../mobile-apk
flutter build apk --release

Hasil build web berada di folder dist/, sedangkan APK Flutter berada di mobile-apk/build/app/outputs/flutter-apk/ 📦

📐 Pola Tampilan Aplikasi
frontend-web — desain mobile-first, bottom navigation, safe area, action bar checkout, pencarian katalog, realtime badge, dan dukungan instalasi PWA
mobile-apk — Material 3 dengan navigation bar 5 tab: Beranda, Menu, Pesanan, Favorit, dan Profil. Produk serta pesanan mengikuti perubahan Supabase secara realtime
admin-dashboard — sidebar pada desktop dan bottom navigation pada mobile. Konten memiliki padding safe area dan route operasional yang bisa dibuka langsung dari navigasi


📌 Catatan Repository

Kalau kalian mau nyalin proyek ini, gak masalah kok Cuma perlu diinget, salinan ini gak nyertain metadata .git, jadi kalau ada folder baru gak bakal kebeda otomatis lewat git status. Struktur yang dijelasin di atas disusun langsung dari folder dan source code yang tersedia pas dokumentasi ini diperbarui.

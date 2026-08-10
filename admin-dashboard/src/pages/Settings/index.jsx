import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock3, ExternalLink, Image, Loader2, MapPin, Package, Percent, Settings, ShieldCheck, Smartphone, Store, Tag, UserCog, Wifi, WifiOff, Zap } from "lucide-react";
import { useDashboardStats } from "../../hooks/useDashboardStats.js";
import { updateStoreInfo } from "../../services/dashboardService.js";
import GoogleMapsLogo from "../../components/ui/GoogleMapsLogo.jsx";

const Map=GoogleMapsLogo;

const groups = [
  { title: "Toko & Operasional", description: "Identitas, lokasi, dan ketersediaan layanan pelanggan.", items: [
    { to: "/lokasi-toko", title: "Identitas & Lokasi Toko", text: "Nama outlet, alamat lengkap, WhatsApp, koordinat, dan status buka/tutup.", Icon: Store, color: "bg-orange-50 text-primary" },
    { to: "/pengaturan-map", title: "Pengaturan Peta", text: "Atur titik latitude dan longitude yang digunakan Web serta APK.", Icon: Map, color: "bg-blue-50 text-blue-600" },
    { to: "/jam-operasional", title: "Jam Operasional", text: "Kelola jam buka, jam tutup, dan informasi layanan toko.", Icon: Clock3, color: "bg-emerald-50 text-emerald-600" },
  ]},
  { title: "Katalog & Pemasaran", description: "Konten pelanggan yang disinkronkan melalui Supabase realtime.", items: [
    { to: "/produk", title: "Katalog Produk", text: "Harga, stok, gambar, status produk, dan detail penjualan.", Icon: Package, color: "bg-violet-50 text-violet-600" },
    { to: "/kategori", title: "Kategori Produk", text: "Kelompokkan produk dan kelola tampilan kategori pelanggan.", Icon: Tag, color: "bg-amber-50 text-amber-600" },
    { to: "/flash-sale", title: "Flash Sale", text: "Produk khusus, harga diskon, stok, dan periode flash sale.", Icon: Zap, color: "bg-red-50 text-red-600" },
    { to: "/promo", title: "Promo Pelanggan", text: "Kode promo, diskon persen atau nominal, dan status publikasi.", Icon: Percent, color: "bg-pink-50 text-pink-600" },
    { to: "/banner-promo", title: "Banner Beranda", text: "Slider promosi Web dan APK, gambar, tautan, serta status aktif.", Icon: Image, color: "bg-cyan-50 text-cyan-600" },
  ]},
  { title: "Aplikasi & Keamanan", description: "Distribusi aplikasi dan pengelolaan akses administrator.", items: [
    { to: "/apk", title: "Versi Aplikasi APK", text: "File rilis, nomor versi, ukuran, tautan unduhan, dan force update.", Icon: Smartphone, color: "bg-slate-100 text-slate-700" },
    { to: "/akun-admin", title: "Akun Administrator", text: "Profil, email, keamanan akun, sesi, dan informasi akses admin.", Icon: UserCog, color: "bg-indigo-50 text-indigo-600" },
  ]},
];

function SettingCard({ item }) {
  const { to, title, text, Icon, color } = item;
  return <Link to={to} className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${color}`}><Icon size={20}/></span><ArrowRight size={16} className="mt-2 text-gray-300 transition group-hover:translate-x-1 group-hover:text-primary"/></div><h3 className="mt-4 text-sm font-bold text-gray-900">{title}</h3><p className="mt-1.5 text-[11px] leading-[18px] text-gray-500">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-primary">Buka pengaturan <ExternalLink size={11}/></span></Link>;
}

export default function SettingsIndex() {
  const data = useDashboardStats();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const store = data.storeInfo || {};
  const apk = data.apkVersion || {};
  const connected = data.realtimeStatus === "SUBSCRIBED";
  const checks = useMemo(() => [
    { label: "Nama toko", complete: Boolean(store.name?.trim()) },
    { label: "Alamat lengkap", complete: Boolean(store.address?.trim()) },
    { label: "Nomor WhatsApp", complete: Boolean(store.phone?.trim()) },
    { label: "Koordinat lokasi", complete: Number.isFinite(Number(store.latitude)) && Number.isFinite(Number(store.longitude)) },
    { label: "Jam operasional", complete: Boolean(store.open_time && store.close_time) },
    { label: "Versi aplikasi", complete: Boolean(apk.version) },
    { label: "File APK", complete: Boolean(apk.download_url) },
  ], [store, apk]);
  const completeCount = checks.filter((item) => item.complete).length;
  const completeness = Math.round((completeCount / checks.length) * 100);

  const toggleStore = async () => {
    setSaving(true); setMessage(""); setError("");
    try {
      const nextOpen = store.is_open === false;
      await updateStoreInfo({ ...store, is_open: nextOpen });
      setMessage(`Toko berhasil ${nextOpen ? "dibuka" : "ditutup"}. Perubahan dikirim realtime ke Web dan APK.`);
    } catch (reason) { setError(reason.message || "Status toko gagal diperbarui."); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 p-5 text-white shadow-xl sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-orange-300"><Settings size={14}/>Configuration Control Center</p><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Pengaturan Umum</h1><p className="mt-2 max-w-2xl text-xs leading-5 text-white/60 sm:text-sm">Pusat konfigurasi lengkap Dashboard, Web, dan APK. Semua perubahan utama disimpan pada Supabase dan disinkronkan secara realtime ya sayangku cintaku.</p></div><div className="grid grid-cols-2 gap-3 sm:min-w-80"><div className="rounded-2xl bg-white/10 p-4 backdrop-blur"><span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${connected ? "text-emerald-300" : "text-amber-300"}`}>{connected ? <Wifi size={13}/> : <WifiOff size={13}/>} {connected ? "REALTIME AKTIF" : "MENGHUBUNGKAN"}</span><strong className="mt-2 block text-lg">Supabase</strong><p className="text-[9px] text-white/50">Sumber data utama</p></div><div className="rounded-2xl bg-white/10 p-4 backdrop-blur"><span className="text-[10px] font-bold text-orange-300">KELENGKAPAN</span><strong className="mt-2 block text-lg">{completeness}%</strong><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-orange-400" style={{ width: `${completeness}%` }}/></div></div></div></div></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</p>}{message && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 size={15}/>{message}</p>}

    <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]"><div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Identitas aktif</p><h2 className="mt-1 text-lg font-bold text-gray-900">{store.name || "Nama toko belum diatur"}</h2><p className="mt-1 max-w-xl text-xs leading-5 text-gray-500">{store.address || "Alamat toko belum dilengkapi."}</p></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${store.is_open !== false ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}><span className={`h-2 w-2 rounded-full ${store.is_open !== false ? "animate-pulse bg-emerald-500" : "bg-red-500"}`}/>{store.is_open !== false ? "Toko Buka" : "Toko Tutup"}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-gray-50 p-3"><p className="text-[9px] text-gray-400">WhatsApp</p><strong className="mt-1 block text-xs text-gray-700">{store.phone || "Belum diatur"}</strong></div><div className="rounded-2xl bg-gray-50 p-3"><p className="text-[9px] text-gray-400">Jam pelayanan</p><strong className="mt-1 block text-xs text-gray-700">{store.open_time?.slice?.(0,5) || "--:--"} – {store.close_time?.slice?.(0,5) || "--:--"}</strong></div><div className="rounded-2xl bg-gray-50 p-3"><p className="text-[9px] text-gray-400">Koordinat</p><strong className="mt-1 block truncate text-xs text-gray-700">{store.latitude ?? "-"}, {store.longitude ?? "-"}</strong></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><button onClick={toggleStore} disabled={saving || data.loading} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 ${store.is_open !== false ? "bg-red-600" : "bg-emerald-600"}`}>{saving ? <Loader2 size={15} className="animate-spin"/> : <Store size={15}/>} {store.is_open !== false ? "Tutup Toko Sekarang" : "Buka Toko Sekarang"}</button><Link to="/lokasi-toko" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gray-900 text-xs font-bold text-white"><MapPin size={15}/>Edit Informasi Lengkap</Link></div></div>
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status Konfigurasi</p><h2 className="mt-1 text-sm font-bold">{completeCount} dari {checks.length} lengkap</h2></div><ShieldCheck className={completeness === 100 ? "text-emerald-500" : "text-amber-500"}/></div><div className="mt-4 space-y-2">{checks.map((item)=><div key={item.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-xs"><span className="text-gray-600">{item.label}</span><span className={`inline-flex items-center gap-1 font-bold ${item.complete ? "text-emerald-600" : "text-amber-600"}`}>{item.complete ? <CheckCircle2 size={13}/> : <span className="h-2 w-2 rounded-full bg-amber-500"/>}{item.complete ? "Lengkap" : "Perlu diisi"}</span></div>)}</div></div></section>

    {groups.map((group)=><section key={group.title}><div className="mb-3"><h2 className="text-base font-bold text-gray-900">{group.title}</h2><p className="mt-0.5 text-xs text-gray-500">{group.description}</p></div><div className={`grid gap-3 ${group.items.length > 3 ? "sm:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-3"}`}>{group.items.map((item)=><SettingCard key={item.to} item={item}/>)}</div></section>)}
    <footer className="flex flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2"><Wifi size={15}/><strong>Sinkronisasi:</strong> perubahan konfigurasi dikirim melalui Supabase Realtime.</span><span className="text-[10px] text-blue-500">Terakhir diperbarui: {data.lastUpdated ? data.lastUpdated.toLocaleString("id-ID") : "menunggu data"}</span></footer>
  </div>;
}

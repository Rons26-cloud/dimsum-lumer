import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bell, BellRing, CheckCheck, ChevronRight, Menu, Package, Percent, ShoppingBag, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { TABLES } from "../../supabase/constants.js";
import { supabase } from "../../supabase/client.js";
import AdminThemeToggle from "../theme/AdminThemeToggle.jsx";

const TITLES = { "/": "Dashboard", "/produk": "Produk", "/flash-sale": "Flash Sale", "/kategori": "Kategori", "/banner-promo": "Banner Promo", "/promo": "Promo", "/pesanan": "Pesanan", "/pelanggan": "Pelanggan", "/wishlist": "Wishlist", "/reward": "Reward Pelanggan", "/lokasi-toko": "Lokasi Toko", "/pengaturan-map": "Pengaturan Map", "/jam-operasional": "Jam Operasional", "/statistik": "Statistik", "/laporan-penjualan": "Laporan Penjualan", "/arsip-bulanan": "Arsip Bulanan", "/maintenance": "Maintenance", "/pengaturan-umum": "Pengaturan Umum", "/akun-admin": "Akun Admin", "/notifikasi": "Notifikasi Admin", "/pusat-sistem": "Pusat Sistem & Audit", "/apk": "Aplikasi APK" };
const notificationIcon = (type = "") => type.includes("order") || type.includes("payment") ? ShoppingBag : type.includes("promo") || type.includes("flash") ? Percent : type.includes("product") || type.includes("stock") ? Package : BellRing;
const destination = (item) => {
  const type = String(item.type || item.notification_type || "").toLowerCase();
  if (type.includes("order") || type.includes("payment") || item.order_id) return "/pesanan";
  if (type.includes("promo") || type.includes("flash")) return type.includes("flash") ? "/flash-sale" : "/promo";
  if (type.includes("product") || type.includes("stock")) return "/produk";
  return "/";
};
const timeAgo = (value) => {
  if (!value) return "Baru saja";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const notifications = useLiveCollection(TABLES.NOTIFICATIONS);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef(null);
  const rows = useMemo(() => [...(notifications || [])].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)), [notifications]);
  const unread = rows.filter((item) => item.is_read !== true);
  const latest = rows.slice(0, 6);
  const fullName = admin?.user_metadata?.full_name || admin?.user_metadata?.name || "Admin Dimsum";
  const avatarUrl = admin?.user_metadata?.avatar_url || "";
  const initial = fullName.trim().charAt(0).toUpperCase() || "A";

  useEffect(() => {
    const close = (event) => { if (!panelRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const goBack = () => window.history.length > 1 ? navigate(-1) : navigate("/", { replace: true });
  const markRead = async (item) => {
    if (item.is_read !== true) {
      const { error: requestError } = await supabase.from(TABLES.NOTIFICATIONS).update({ is_read: true }).eq("id", item.id);
      if (requestError) { setError(requestError.message); return; }
    }
    setOpen(false); navigate(destination(item));
  };
  const markAll = async () => {
    if (!unread.length) return;
    setMarking(true); setError("");
    const { error: requestError } = await supabase.from(TABLES.NOTIFICATIONS).update({ is_read: true }).in("id", unread.map((item) => item.id));
    if (requestError) setError(requestError.message);
    setMarking(false);
  };

  return <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-100 bg-white/95 px-3 backdrop-blur lg:px-6">
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">{pathname !== "/" && <button type="button" onClick={goBack} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gray-200/70 bg-transparent text-gray-700 lg:hidden" aria-label="Kembali"><ArrowLeft size={20}/></button>}<button onClick={onMenuClick} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-50 text-gray-600 lg:hidden" aria-label="Buka menu"><Menu size={22}/></button><div className="min-w-0"><p className="truncate text-sm font-bold text-gray-900">{TITLES[pathname] || "Admin Dimsum Lumer"}</p><p className="hidden text-[10px] text-gray-400 xs:block">Kelola operasional toko secara realtime</p></div></div>
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <AdminThemeToggle />
      <div ref={panelRef} className="relative"><button type="button" onClick={() => { setOpen((value) => !value); setError(""); }} aria-expanded={open} aria-label={`${unread.length} notifikasi belum dibaca`} className={`relative grid h-10 w-10 place-items-center rounded-full transition ${open ? "bg-orange-50 text-primary" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}><Bell size={18}/>{unread.length > 0 && <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-primary px-1 text-[9px] font-bold text-white">{unread.length > 99 ? "99+" : unread.length}</span>}</button>
        {open && <section className="fixed inset-x-3 top-[4.5rem] z-50 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]" aria-label="Panel notifikasi"><div className="flex items-center justify-between border-b border-gray-100 p-4"><div><h2 className="text-sm font-bold text-gray-900">Notifikasi Admin</h2><p className="mt-0.5 text-[10px] text-gray-400">Pembaruan operasional secara realtime</p></div><button onClick={markAll} disabled={marking || !unread.length} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-2 text-[10px] font-bold text-primary disabled:opacity-40">{marking ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"/> : <CheckCheck size={13}/>}Tandai semua</button></div>{error && <p className="m-3 rounded-lg bg-red-50 p-2 text-[10px] text-red-600">{error}</p>}<div className="max-h-[60dvh] overflow-y-auto">{notifications === null ? <div className="grid h-36 place-items-center"><span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"/></div> : latest.length ? latest.map((item) => { const Icon = notificationIcon(String(item.type || item.notification_type || "").toLowerCase()); return <button key={item.id} onClick={() => markRead(item)} className={`flex w-full items-start gap-3 border-b border-gray-50 p-3.5 text-left transition hover:bg-gray-50 ${item.is_read !== true ? "bg-orange-50/40" : "bg-white"}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.is_read !== true ? "bg-orange-100 text-primary" : "bg-gray-100 text-gray-500"}`}><Icon size={17}/></span><span className="min-w-0 flex-1"><span className="flex items-start gap-2"><strong className="line-clamp-1 flex-1 text-xs text-gray-800">{item.title || item.subject || "Notifikasi baru"}</strong>{item.is_read !== true && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"/>}</span><span className="mt-1 line-clamp-2 text-[10px] leading-4 text-gray-500">{item.message || item.body || item.description || "Ada pembaruan baru pada sistem."}</span><span className="mt-1.5 block text-[9px] font-medium text-gray-400">{timeAgo(item.created_at)}</span></span><ChevronRight size={14} className="mt-3 shrink-0 text-gray-300"/></button>; }) : <div className="px-6 py-12 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-50 text-gray-300"><Bell size={22}/></span><h3 className="mt-3 text-xs font-bold text-gray-700">Belum ada notifikasi</h3><p className="mt-1 text-[10px] text-gray-400">Notifikasi pesanan dan sistem akan tampil di sini.</p></div>}</div><div className="flex items-center justify-between bg-gray-50 px-4 py-3 text-[10px]"><span className="text-gray-400">{rows.length} total notifikasi</span><strong className="text-primary">{unread.length} belum dibaca</strong></div></section>}
      </div>
      <button type="button" onClick={() => navigate("/akun-admin")} className="group flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-gray-50" aria-label="Buka detail akun admin"><span className="grid h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-xs font-extrabold text-white shadow-sm">{avatarUrl ? <img src={avatarUrl} alt={`Foto ${fullName}`} className="h-full w-full object-cover"/> : initial}</span><span className="hidden max-w-40 sm:block"><strong className="block truncate text-xs leading-tight text-gray-800 group-hover:text-primary">{fullName}</strong><span className="mt-0.5 block truncate text-[9px] text-gray-400">{admin?.email || "Admin Dashboard"}</span></span><ChevronRight size={13} className="hidden text-gray-300 sm:block"/></button>
    </div>
  </header>;
}

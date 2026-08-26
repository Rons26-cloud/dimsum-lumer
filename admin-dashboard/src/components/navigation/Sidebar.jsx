import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  LayoutDashboard, Package, Tag, Image, Percent, Receipt, Users, Heart, Zap,
  MapPin, Clock, BarChart3, FileText, Settings, UserCog, LogOut, Wrench, BellRing, ServerCog, Archive, Gift, WalletCards, MessageCircle, Smartphone,
} from "lucide-react";
import logo from "../../assets/logo/logo.png";
import { signOutAdmin } from "../../services/authService.js";
import GoogleMapsLogo from "../ui/GoogleMapsLogo.jsx";
import { supabase } from "../../supabase/client.js";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";

const menuGroups = [
  {
    title: "APLIKASI",
    items: [
      { to: "/app-updates", label: "Update Aplikasi", Icon: Smartphone, color: "text-blue-600", bg: "bg-blue-50", roles: ["admin", "superadmin"] },
    ],
  },
  {
    title: "MENU UTAMA",
    items: [
      { to: "/", label: "Dashboard", Icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-50", end: true },
      { to: "/produk", label: "Produk", Icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
      { to: "/flash-sale", label: "Flash Sale", Icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
      { to: "/kategori", label: "Kategori", Icon: Tag, color: "text-cyan-600", bg: "bg-cyan-50" },
      { to: "/banner-promo", label: "Banner Promo", Icon: Image, color: "text-violet-600", bg: "bg-violet-50" },
      { to: "/promo", label: "Promo", Icon: Percent, color: "text-pink-600", bg: "bg-pink-50" },
      { to: "/pesanan", label: "Pesanan", Icon: Receipt, color: "text-emerald-600", bg: "bg-emerald-50" },
      { to: "/live-chat", label: "Live Chat", Icon: MessageCircle, color: "text-orange-600", bg: "bg-orange-50" },
      { to: "/pelanggan", label: "Pelanggan", Icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
      { to: "/payment-user", label: "Metode Pembayaran", Icon: WalletCards, color: "text-blue-600", bg: "bg-blue-50" },
      { to: "/wishlist", label: "Wishlist", Icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
      { to: "/reward", label: "Reward", Icon: Gift, color: "text-fuchsia-600", bg: "bg-fuchsia-50" },
    ],
  },
  {
    title: "TOKO & LOKASI",
    items: [
      { to: "/lokasi-toko", label: "Lokasi Toko", Icon: MapPin, color: "text-red-600", bg: "bg-red-50" },
      { to: "/pengaturan-map", label: "Pengaturan Map", Icon: GoogleMapsLogo },
      { to: "/jam-operasional", label: "Jam Operasional", Icon: Clock, color: "text-teal-600", bg: "bg-teal-50" },
    ],
  },
  {
    title: "LAPORAN",
    items: [
      { to: "/statistik", label: "Statistik", Icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
      { to: "/laporan-penjualan", label: "Laporan Penjualan", Icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
      { to: "/arsip-bulanan", label: "Arsip Bulanan", Icon: Archive, color: "text-amber-700", bg: "bg-amber-50" },
    ],
  },
  {
    title: "PENGATURAN",
    items: [
      { to: "/maintenance", label: "Maintenance", Icon: Wrench, color: "text-amber-600", bg: "bg-amber-50" },
      { to: "/pengaturan-umum", label: "Pengaturan Umum", Icon: Settings, color: "text-slate-600", bg: "bg-slate-100" },
      { to: "/akun-admin", label: "Akun Admin", Icon: UserCog, color: "text-indigo-600", bg: "bg-indigo-50" },
      { to: "/notifikasi", label: "Notifikasi Admin", Icon: BellRing, color: "text-orange-600", bg: "bg-orange-50" },
      { to: "/pusat-sistem", label: "Pusat Sistem", Icon: ServerCog, color: "text-cyan-700", bg: "bg-cyan-50" },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const [pendingChats,setPendingChats]=useState(0);
  useEffect(()=>{let active=true;const load=async()=>{const {count}=await supabase.from('live_chat_conversations').select('id',{count:'exact',head:true}).eq('status','open').or('admin_read_at.is.null,admin_replied_at.is.null');if(active)setPendingChats(count||0)};load();const channel=supabase.channel('admin-sidebar-live-chat').on('postgres_changes',{event:'*',schema:'public',table:'live_chat_conversations'},load).subscribe();return()=>{active=false;supabase.removeChannel(channel)}},[]);
  const handleMenuNavigation = (event, to) => {
    if (to === "/akun-admin") {
      event.preventDefault();
      onClose?.();
      navigate("/akun-admin", { replace: false });
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
      return;
    }
    onClose?.();
  };
  const handleSignOut = async () => {
    try { onClose?.(); await signOutAdmin(); navigate("/login", { replace: true }); }
    catch (error) { console.error("Logout gagal", error); }
  };
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={clsx(
          "fixed lg:sticky top-0 left-0 h-dvh w-64 bg-white border-r border-gray-100 z-40 transition-transform duration-200 overflow-y-auto",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-100">
          <img src={logo} alt="Dimsum Lumer" className="w-9 h-9 rounded-full object-cover" />
          <div>
            <p className="font-bold text-sm leading-tight">Dimsum Lumer</p>
            <p className="text-[11px] text-gray-400 leading-tight">Admin Dashboard</p>
          </div>
        </div>

        <nav className="px-3 py-4">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((item) => !item.roles || item.roles.includes(admin?.adminRole));
            if (!visibleItems.length) return null;
            return (
            <div key={group.title} className="mb-5">
              <p className="text-[10px] font-bold text-gray-400 tracking-wider px-3 mb-1.5">{group.title}</p>
              {visibleItems.map(({ to, label, Icon, color = "text-slate-600", bg = "bg-slate-100", end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={(event) => handleMenuNavigation(event, to)}
                  className={({ isActive }) =>
                    clsx(
                      "relative mb-0.5 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "border-orange-600 bg-orange-500 font-bold text-white shadow-md shadow-orange-200"
                        : "border-transparent text-gray-600 hover:border-gray-100 hover:bg-gray-50 hover:text-gray-900"
                    )
                  }
                >
                  {({ isActive }) => <>
                    {isActive && <span className="absolute -left-1 h-6 w-1 rounded-full bg-gray-900" aria-hidden="true"/>}
                    <span className={clsx("grid h-7 w-7 place-items-center rounded-lg", isActive ? "bg-white/20 text-white" : `${bg} ${color}`)}><Icon size={17} strokeWidth={isActive ? 2.6 : 2}/></span>
                    <span className={isActive ? "text-white" : "text-inherit"}>{label}</span>
                    {to === "/live-chat" && pendingChats > 0 && <span className={`ml-auto grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${isActive ? "bg-white text-red-600" : "bg-red-600 text-white"}`}>{pendingChats > 99 ? "99+" : pendingChats}</span>}
                    {isActive && to !== "/live-chat" && <span className="ml-auto h-2 w-2 rounded-full bg-white ring-4 ring-white/20" aria-label="Menu aktif"/>}
                  </>}
                </NavLink>
              ))}
            </div>
          );})}

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={17} strokeWidth={2} /> Logout
          </button>
        </nav>
      </aside>
    </>
  );
}

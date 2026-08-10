import { NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard, Package, Tag, Image, Percent, Receipt, Users, Heart, Zap,
  MapPin, Clock, BarChart3, FileText, Settings, UserCog, LogOut, Wrench, BellRing, ServerCog,
} from "lucide-react";
import logo from "../../assets/logo/logo.png";
import { signOutAdmin } from "../../services/authService.js";
import GoogleMapsLogo from "../ui/GoogleMapsLogo.jsx";

const menuGroups = [
  {
    title: "MENU UTAMA",
    items: [
      { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
      { to: "/produk", label: "Produk", Icon: Package },
      { to: "/flash-sale", label: "Flash Sale", Icon: Zap },
      { to: "/kategori", label: "Kategori", Icon: Tag },
      { to: "/banner-promo", label: "Banner Promo", Icon: Image },
      { to: "/promo", label: "Promo", Icon: Percent },
      { to: "/pesanan", label: "Pesanan", Icon: Receipt },
      { to: "/pelanggan", label: "Pelanggan", Icon: Users },
      { to: "/wishlist", label: "Wishlist", Icon: Heart },
    ],
  },
  {
    title: "TOKO & LOKASI",
    items: [
      { to: "/lokasi-toko", label: "Lokasi Toko", Icon: MapPin },
      { to: "/pengaturan-map", label: "Pengaturan Map", Icon: GoogleMapsLogo },
      { to: "/jam-operasional", label: "Jam Operasional", Icon: Clock },
    ],
  },
  {
    title: "LAPORAN",
    items: [
      { to: "/statistik", label: "Statistik", Icon: BarChart3 },
      { to: "/laporan-penjualan", label: "Laporan Penjualan", Icon: FileText },
    ],
  },
  {
    title: "PENGATURAN",
    items: [
      { to: "/maintenance", label: "Maintenance", Icon: Wrench },
      { to: "/pengaturan-umum", label: "Pengaturan Umum", Icon: Settings },
      { to: "/akun-admin", label: "Akun Admin", Icon: UserCog },
      { to: "/notifikasi", label: "Notifikasi Admin", Icon: BellRing },
      { to: "/pusat-sistem", label: "Pusat Sistem", Icon: ServerCog },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const handleMenuNavigation = (event, to) => {
    // Pastikan halaman akun dibuka oleh React Router. Pada beberapa hosting,
    // request URL baru dapat terkena fallback dan kembali ke Dashboard utama.
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
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="text-[10px] font-bold text-gray-400 tracking-wider px-3 mb-1.5">{group.title}</p>
              {group.items.map(({ to, label, Icon, end }) => (
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
                    <span className={clsx("grid h-7 w-7 place-items-center rounded-lg", isActive ? "bg-white/20 text-white" : "text-gray-500")}><Icon size={17} strokeWidth={isActive ? 2.6 : 2}/></span>
                    <span className={isActive ? "text-white" : "text-inherit"}>{label}</span>
                    {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-white ring-4 ring-white/20" aria-label="Menu aktif"/>}
                  </>}
                </NavLink>
              ))}
            </div>
          ))}

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

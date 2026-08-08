import { NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard, Package, Tag, Image, Percent, Receipt, Users, Heart, Zap,
  MapPin, Map, Clock, BarChart3, FileText, Settings, UserCog, LogOut,
} from "lucide-react";
import logo from "../../assets/logo/logo.png";
import { signOutAdmin } from "../../services/authService.js";

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
      { to: "/pengaturan-map", label: "Pengaturan Map", Icon: Map },
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
      { to: "/pengaturan-umum", label: "Pengaturan Umum", Icon: Settings },
      { to: "/akun-admin", label: "Akun Admin", Icon: UserCog },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
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
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors",
                      isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                    )
                  }
                >
                  <Icon size={17} strokeWidth={2} />
                  {label}
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

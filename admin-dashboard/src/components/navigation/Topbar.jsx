import { Menu, Bell, User } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { TABLES } from "../../supabase/constants.js";

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const pageTitle = ({ '/': 'Dashboard', '/produk': 'Produk', '/pesanan': 'Pesanan', '/pelanggan': 'Pelanggan', '/promo': 'Promo', '/pengaturan-umum': 'Pengaturan' })[pathname] || 'Admin UMKM';
  const { admin } = useAdminAuth();
  // Realtime: notifikasi baru (mis. pesanan masuk) langsung menambah badge lonceng.
  const notifications = useLiveCollection(TABLES.NOTIFICATIONS);
  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 h-16 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl bg-gray-50 grid place-items-center text-gray-600" aria-label="Buka menu">
          <Menu size={22} />
        </button>
        <div><p className="text-sm font-bold text-gray-900">{pageTitle}</p><p className="hidden xs:block text-[10px] text-gray-400">Kelola Dimsum Lumer</p></div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button type="button" aria-label={`${unreadCount} notifikasi belum dibaca`} className="relative w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell size={18} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <User size={16} strokeWidth={2} />
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold leading-tight">{admin?.user_metadata?.full_name ?? "Admin Dimsum"}</p>
            <p className="text-[11px] text-gray-400 leading-tight">{admin?.email ?? "admin@dimsumlumer.com"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useCart } from "../../hooks/useCart.js";
import { useNotifications } from "../../hooks/useNotifications.js";
import logo from "../../assets/logo/logo.png";

export default function Navbar({ sticky = true }) {
  const { user } = useAuth();
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <header className={`${sticky ? "sticky top-0 z-30" : "relative z-10"} h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 border-b border-gray-100 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:h-[calc(4rem+env(safe-area-inset-top))]`}>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:h-16">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="Dimsum Lumer" className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11" />
          <span className="font-extrabold text-sm sm:text-base text-primary leading-tight truncate">
            Dimsum Lumer
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link to="/produk" className="hover:text-primary transition-colors">Produk</Link>
          <Link to="/promo" className="hover:text-primary transition-colors">Promo</Link>
          <Link to="/lokasi-toko" className="hover:text-primary transition-colors">Lokasi Toko</Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link
            to="/keranjang"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 transition-all hover:bg-gray-100 active:scale-95"
            aria-label="Keranjang"
          >
            <ShoppingCart size={17} strokeWidth={2} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center animate-fade-in">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => navigate("/notifikasi")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 transition-all hover:bg-gray-100 active:scale-95"
            aria-label="Notifikasi"
          >
            <Bell size={17} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center animate-fade-in">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

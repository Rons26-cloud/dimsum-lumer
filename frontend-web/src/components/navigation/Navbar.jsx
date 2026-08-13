import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useCart } from "../../hooks/useCart.js";
import { useNotifications } from "../../hooks/useNotifications.js";
import logo from "../../assets/logo/logo.png";
import ThemeToggle from "../theme/ThemeToggle.jsx";

export default function Navbar({ sticky = true, autoHide = false }) {
  const { user } = useAuth();
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const directionDistance = useRef(0);
  const lastDirection = useRef("up");

  useEffect(() => {
    if (!autoHide) {
      setVisible(true);
      return undefined;
    }

    lastScrollY.current = Math.max(0, window.scrollY);
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const currentY = Math.max(0, window.scrollY);
        const delta = currentY - lastScrollY.current;
        const pageHeight = document.documentElement.scrollHeight;
        const atBottom = currentY + window.innerHeight >= pageHeight - 12;
        const shortPage = pageHeight <= window.innerHeight + 96;
        const direction = delta > 0 ? "down" : delta < 0 ? "up" : lastDirection.current;

        if (direction !== lastDirection.current) directionDistance.current = 0;
        directionDistance.current += Math.abs(delta);
        lastDirection.current = direction;

        if (shortPage || currentY < 32 || atBottom) setVisible(true);
        else if (direction === "up" && directionDistance.current >= 8) setVisible(true);
        else if (direction === "down" && currentY > 120 && directionDistance.current >= 72) setVisible(false);

        lastScrollY.current = currentY;
      });
    };
    const handleWheel = (event) => { if (event.deltaY < 0) setVisible(true); };
    let touchY = null;
    const handleTouchStart = (event) => { touchY = event.touches[0]?.clientY ?? null; };
    const handleTouchMove = (event) => {
      const nextY = event.touches[0]?.clientY;
      if (touchY !== null && nextY !== undefined && nextY - touchY > 8) setVisible(true);
      if (nextY !== undefined) touchY = nextY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [autoHide]);

  return (
    <header className={`${sticky ? "sticky top-0 z-30" : "relative z-10"} h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 border-b border-gray-100 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md transition-all duration-300 ease-out sm:h-[calc(4rem+env(safe-area-inset-top))] md:translate-y-0 md:opacity-100 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"}`}>
      <div className={`mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:h-16 ${autoHide ? "translate-y-1" : ""}`}>
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
          <ThemeToggle />
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

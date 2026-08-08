import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Home, ReceiptText, User, Utensils } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: "home", label: "Beranda", path: "/", Icon: Home },
  { id: "menu", label: "Menu", path: "/produk", Icon: Utensils },
  { id: "orders", label: "Pesanan", path: "/orders", Icon: ReceiptText, elevated: true },
  { id: "wishlist", label: "Favorit", path: "/wishlist", Icon: Heart },
  { id: "profile", label: "Profil", path: "/profil", Icon: User },
];

function tabFromPath(pathname) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/produk")) return "menu";
  if (pathname.startsWith("/orders") || pathname.startsWith("/lacak-pesanan")) return "orders";
  if (pathname.startsWith("/wishlist")) return "wishlist";
  if (pathname.startsWith("/profil")) return "profile";
  return "home";
}

export default function BottomNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentTab = useMemo(() => tabFromPath(pathname), [pathname]);
  const [activeTab, setActiveTab] = useState(currentTab);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => setActiveTab(currentTab), [currentTab]);
  useEffect(() => {
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

        // Navigasi selalu tersedia pada awal dan batas akhir halaman.
        if (currentY < 24 || atBottom) setVisible(true);
        else if (delta > 5) setVisible(false);
        else if (delta < -5) setVisible(true);
        lastScrollY.current = currentY;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const selectTab = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  return (
    <nav
      aria-label="Navigasi utama"
      className={`fixed inset-x-3 bottom-[calc(.5rem+env(safe-area-inset-bottom))] z-40 mx-auto h-14 max-w-md rounded-[22px] border border-gray-100/90 bg-white/95 px-1.5 shadow-[0_8px_24px_rgba(17,24,39,.12)] backdrop-blur-md transition-all duration-300 ease-out md:hidden ${visible ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none"}`}
    >
      <div className="grid h-full grid-cols-5 items-center">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.Icon;

          if (tab.elevated) {
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => selectTab(tab)}
                className="relative flex h-full min-w-0 flex-col items-center justify-end pb-1 text-[8px] font-bold text-dark"
                aria-current={active ? "page" : undefined}
              >
                <span className={`absolute top-0 grid h-12 w-12 -translate-y-3.5 place-items-center rounded-full border-4 border-white shadow-[0_6px_16px_rgba(17,24,39,.18)] transition-all ${active ? "bg-primary text-white" : "bg-neutral-900 text-white"}`}>
                  <Icon size={19} strokeWidth={2.2} />
                </span>
                <span>{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => selectTab(tab)}
              className={`relative flex h-full min-w-0 flex-col items-center justify-center gap-px text-[8px] font-semibold transition-colors ${active ? "text-primary" : "text-gray-600"}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={active ? 2.3 : 1.9} fill={tab.id === "wishlist" && active ? "currentColor" : "none"} />
              <span>{tab.label}</span>
              {active && <span className="absolute bottom-0.5 h-0.5 w-4 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Home, ReceiptText, User, Utensils } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const tabDefinitions = [
  { id: "home", labelKey: "nav.home", path: "/", Icon: Home, color: "text-orange-600", soft: "bg-orange-50" },
  { id: "menu", labelKey: "nav.menu", path: "/produk", Icon: Utensils, color: "text-amber-600", soft: "bg-amber-50" },
  { id: "orders", labelKey: "nav.orders", path: "/orders", Icon: ReceiptText, color: "text-blue-600", soft: "bg-blue-50", elevated: true },
  { id: "wishlist", labelKey: "nav.wishlist", path: "/wishlist", Icon: Heart, color: "text-rose-600", soft: "bg-rose-50" },
  { id: "profile", labelKey: "nav.profile", path: "/profil", Icon: User, color: "text-violet-600", soft: "bg-violet-50" },
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
  const { t } = useLanguage();
  const tabs = useMemo(() => tabDefinitions.map((tab) => ({ ...tab, label: t(tab.labelKey) })), [t]);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentTab = useMemo(() => tabFromPath(pathname), [pathname]);
  const [activeTab, setActiveTab] = useState(currentTab);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const directionDistance = useRef(0);
  const lastDirection = useRef("up");

  useEffect(() => { setActiveTab(currentTab); setVisible(true); }, [currentTab]);
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
        const direction = delta > 0 ? "down" : delta < 0 ? "up" : lastDirection.current;

        if (direction !== lastDirection.current) directionDistance.current = 0;
        directionDistance.current += Math.abs(delta);
        lastDirection.current = direction;

        const shortPage = pageHeight <= window.innerHeight + 96;
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
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const selectTab = (tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  return (
    <nav
      aria-label={t("nav.main")}
      className={`fixed inset-x-3 bottom-[calc(.5rem+env(safe-area-inset-bottom))] z-40 mx-auto h-16 max-w-md rounded-[22px] border border-gray-100/90 bg-white/95 px-1.5 shadow-[0_8px_24px_rgba(17,24,39,.12)] backdrop-blur-md transition-all duration-300 ease-out md:hidden ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[calc(100%+2rem)] opacity-0"}`}
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
                className="relative flex h-full min-w-0 flex-col items-center justify-end pb-1.5 text-[10px] font-bold text-dark"
                aria-current={active ? "page" : undefined}
              >
                <span className={`absolute top-0 grid h-12 w-12 -translate-y-3 place-items-center rounded-full border-4 border-white shadow-[0_6px_16px_rgba(17,24,39,.16)] transition-all ${active ? "bg-blue-600 text-white" : `${tab.soft} ${tab.color}`}`}>
                  <Icon size={20} strokeWidth={2.2} />
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
              className={`relative flex h-full min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${active ? tab.color : "text-slate-600"}`}
              aria-current={active ? "page" : undefined}
            >
              <span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? tab.soft : "bg-transparent"}`}><Icon size={20} strokeWidth={active ? 2.3 : 1.9} fill={tab.id === "wishlist" && active ? "currentColor" : "none"} /></span>
              <span>{tab.label}</span>
              {active && <span className={`absolute bottom-0.5 h-0.5 w-4 rounded-full ${tab.soft.replace("bg-", "bg-")}`} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

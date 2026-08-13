import { Outlet, NavLink, useLocation } from "react-router-dom";
import Navbar from "../components/navigation/Navbar.jsx";
import BottomNavigation from "../components/navigation/BottomNavigation.jsx";
import clsx from "clsx";

const menu = [
  { to: "/profil", label: "Akun Saya" },
  { to: "/profil/alamat", label: "Alamat" },
  { to: "/profil/poin", label: "Poin Saya" },
  { to: "/profil/riwayat-poin", label: "Riwayat Poin" },
  { to: "/profil/reward", label: "Reward" },
];

export default function ProfileLayout() {
  const { pathname } = useLocation();
  const isOverview = pathname === "/profil" || pathname === "/profil/detail";
  const isInformation = pathname.startsWith("/profil/informasi/");
  const isLoyaltyPage = ["/profil/alamat", "/profil/poin", "/profil/riwayat-poin", "/profil/reward", "/profil/pengaturan-notifikasi", "/profil/metode-pembayaran"].includes(pathname);
  const hasDedicatedHeader = isInformation || isLoyaltyPage;
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      {!isOverview && !hasDedicatedHeader && <Navbar />}
      {!isOverview && !hasDedicatedHeader && <div className="scrollbar-hide sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 overflow-x-auto border-b border-gray-100 bg-white md:hidden"><div className="flex min-w-max gap-1 px-3 py-2">{menu.map((m) => <NavLink key={m.to} to={m.to} end className={({isActive}) => clsx('px-3 py-2 rounded-xl text-xs font-semibold', isActive ? 'bg-primary text-white' : 'text-gray-500')}>{m.label}</NavLink>)}</div></div>}
      <div className={`grid w-full flex-1 gap-3 pb-[calc(72px+env(safe-area-inset-bottom))] md:mx-auto md:pb-6 ${isOverview ? 'max-w-md px-3 py-2 md:py-5' : hasDedicatedHeader ? 'max-w-2xl px-3 pb-6' : 'max-w-5xl px-3 py-2 md:grid-cols-[220px_1fr] md:py-5'}`}>
        {!isOverview && !hasDedicatedHeader && <aside className="sticky top-[calc(5rem+env(safe-area-inset-top))] hidden max-h-[calc(100dvh-6rem)] self-start overflow-y-auto rounded-2xl border border-gray-100 bg-white p-3 md:block">
          {menu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end
              className={({ isActive }) =>
                clsx(
                  "block px-3 py-2.5 rounded-xl text-sm font-medium mb-1",
                  isActive ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-white"
                )
              }
            >
              {m.label}
            </NavLink>
          ))}
        </aside>}
        <main><Outlet /></main>
      </div>
      <BottomNavigation />
    </div>
  );
}

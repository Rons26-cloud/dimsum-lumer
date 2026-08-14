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
    <div className="mobile-app-shell min-h-dvh flex flex-col bg-gray-50">
      {!isOverview && !hasDedicatedHeader && <Navbar />}
      {!isOverview && !hasDedicatedHeader && <div className="scrollbar-hide sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 overflow-x-auto border-b border-gray-100 bg-white"><div className="flex min-w-max gap-1 px-3 py-2">{menu.map((m) => <NavLink key={m.to} to={m.to} end className={({isActive}) => clsx('px-3 py-2 rounded-xl text-xs font-semibold', isActive ? 'bg-primary text-white' : 'text-gray-500')}>{m.label}</NavLink>)}</div></div>}
      <div className={`grid w-full max-w-md flex-1 gap-3 px-3 pb-[calc(88px+env(safe-area-inset-bottom))] ${isOverview ? 'py-2' : hasDedicatedHeader ? 'pb-6' : 'py-2'}`}>
        <main><Outlet /></main>
      </div>
      <BottomNavigation />
    </div>
  );
}

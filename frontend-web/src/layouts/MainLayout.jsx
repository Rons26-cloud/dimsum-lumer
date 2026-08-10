import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/navigation/Navbar.jsx";
import { useStoreStatus } from "../hooks/useStoreStatus.js";
import Footer from "../components/navigation/Footer.jsx";
import BottomNavigation from "../components/navigation/BottomNavigation.jsx";
import { useCart } from "../hooks/useCart.js";

// Layout utama untuk semua halaman customer publik
export default function MainLayout() {
  const store = useStoreStatus();
  const { pathname } = useLocation();
  const cartHasItems=useCart((state)=>state.items.length>0);
  const isProductDetail = /^\/produk\/[^/]+\/?$/.test(pathname) || /^\/flash-sale\/[^/]+\/?$/.test(pathname) || pathname === "/pesan-whatsapp";
  const hideHeader = isProductDetail || pathname === "/lokasi-toko" || pathname === "/keranjang";
  const hideBottomChrome = isProductDetail || (pathname === "/keranjang" && cartHasItems);

  return (
    // Tambahkan utility untuk menyembunyikan scrollbar di sini
    <div className="min-h-dvh flex flex-col bg-gray-50 overflow-x-clip [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {!hideHeader && <Navbar />}
      {!store.loading && !store.isOpen && <div role="status" className="sticky top-0 z-40 border-y border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-800">Toko sedang tutup. Anda tetap bisa melihat menu, namun pesanan baru tidak dapat diproses.</div>}
      <main className={`w-full flex-1 ${isProductDetail ? "pb-0" : "pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0"}`}>
        <Outlet />
      </main>
      {!hideBottomChrome && <Footer />}
      {!hideBottomChrome && <BottomNavigation />}
    </div>
  );
}

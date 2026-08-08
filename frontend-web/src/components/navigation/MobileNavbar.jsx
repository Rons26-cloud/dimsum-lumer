import React from "react";
import { Search, Bell, ShoppingBag, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Komponen MobileNavbar
 * Varian navbar khusus mobile dengan baris pencarian besar dan tombol aksi cepat,
 * otomatis tersembunyi saat scroll ke bawah dan muncul kembali saat scroll ke atas.
 */
export default function MobileNavbar({ 
  searchQuery = "", 
  onSearchChange, 
  onSearchSubmit, 
  onNotificationClick, 
  onCartClick,
  locationText = "Pilih Lokasi",
  className = "" 
}) {
  const navigate = useNavigate();
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 translate-y-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 pt-3 pb-3.5 shadow-2xs md:hidden ${className}`.trim()}
    >
      {/* Baris Atas: Informasi Lokasi & Aksi Cepat (Notifikasi & Keranjang) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <MapPin size={14} className="text-primary flex-shrink-0" />
          <span className="truncate max-w-[200px] text-dark font-semibold">{locationText}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNotificationClick || (() => navigate("/notifikasi"))}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors relative"
            aria-label="Notifikasi"
          >
            <Bell size={20} strokeWidth={1.75} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>

          <button
            type="button"
            onClick={onCartClick || (() => navigate("/keranjang"))}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors relative"
            aria-label="Keranjang"
          >
            <ShoppingBag size={20} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Baris Bawah: Search Bar Besar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Cari produk, kategori, atau kebutuhan..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all text-dark placeholder-gray-400 shadow-2xs"
        />
      </form>
    </header>
  );
}

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Database, RefreshCw } from "lucide-react";

const STORAGE_KEY = "admin:last-data-update";
const TABLE_LABELS = { orders: "Pesanan", order_items: "Item Pesanan", order_detail: "Detail Pesanan", products: "Produk", categories: "Kategori", flash_sales: "Flash Sale", promos: "Promo", notifications: "Notifikasi", profiles: "Pelanggan", stores: "Toko", app_config: "Konfigurasi", wishlist: "Wishlist" };
const readLastUpdate = () => {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || null; }
  catch { return null; }
};

export default function AdminUpdateTimestamp() {
  const [now, setNow] = useState(() => new Date());
  const [lastUpdate, setLastUpdate] = useState(readLastUpdate);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    const handleUpdate = (event) => {
      const next = { at: new Date().toISOString(), table: event.detail?.table || "system" };
      setLastUpdate(next);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    };
    window.addEventListener("admin:data-success", handleUpdate);
    return () => { window.clearInterval(timer); window.removeEventListener("admin:data-success", handleUpdate); };
  }, []);

  const updatedAt = lastUpdate?.at ? new Date(lastUpdate.at) : null;
  return <section className="mb-4 flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
    <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><RefreshCw size={15} className="animate-[spin_3s_linear_infinite]"/></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Sinkronisasi Realtime Aktif</p><p className="truncate text-[10px] text-gray-500">{updatedAt ? <>Perubahan terakhir <strong className="text-gray-700">{updatedAt.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}, {updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong> · {TABLE_LABELS[lastUpdate.table] || lastUpdate.table}</> : "Menunggu sinkronisasi data Supabase..."}</p></div></div>
    <div className="flex items-center gap-2 border-t border-gray-50 pt-2 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"><span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[9px] font-semibold text-gray-600"><CalendarDays size={12}/>{now.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span><span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-2.5 py-1.5 font-mono text-[9px] font-bold text-white"><Clock3 size={12}/>{now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span><span className="hidden items-center gap-1 text-[9px] text-gray-400 md:inline-flex"><Database size={11}/>Supabase</span></div>
  </section>;
}

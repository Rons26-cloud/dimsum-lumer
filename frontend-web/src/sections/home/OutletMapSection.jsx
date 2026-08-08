import { Link } from "react-router-dom";
import { MapPin, ChevronRight, Navigation } from "lucide-react";
import { useStoreStatus } from "../../hooks/useStoreStatus.js";

export default function OutletMapSection() {
  const store=useStoreStatus();
  return (
    <section className="mt-6 px-4">
      <h2 className="font-bold text-dark text-base mb-3">Lokasi Toko Terdekat</h2>
      <Link
        to="/lokasi-toko"
        className="flex min-h-20 items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50"
      >
        <span className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><MapPin size={18}/></span><span className="min-w-0"><strong className="block truncate text-xs text-slate-900">{store.name||'Dimsum Lumer - Hongkong Fashion'}</strong><span className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-slate-500"><Navigation size={10}/>{store.address||'Jalan Sisingamangaraja, Medan Amplas'}</span></span></span>
        <ChevronRight size={16} className="text-gray-400" />
      </Link>
    </section>
  );
}

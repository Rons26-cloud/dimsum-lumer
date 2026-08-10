import { Link } from "react-router-dom";
import { ChevronRight, Navigation } from "lucide-react";
import { useStoreStatus } from "../../hooks/useStoreStatus.js";
import MapsIcon from "../../components/maps/MapsIcon.jsx";

export default function OutletMapSection() {
  const store=useStoreStatus();
  return (
    <section className="mt-5 px-3 xs:px-4">
      <h2 className="mb-2 text-base font-bold text-dark">Alamat Toko</h2>
      <Link
        to="/lokasi-toko"
        className="flex min-h-20 items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm transition-colors hover:bg-slate-50"
      >
        <span className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50"><MapsIcon size={25}/></span><span className="min-w-0"><strong className="block truncate text-sm text-slate-900">{store.name||'Dimsum Lumer - Hongkong Fashion'}</strong><span className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><Navigation size={12}/>{store.address||'Jalan Sisingamangaraja, Medan Amplas'}</span></span></span>
        <ChevronRight size={16} className="text-gray-400" />
      </Link>
    </section>
  );
}

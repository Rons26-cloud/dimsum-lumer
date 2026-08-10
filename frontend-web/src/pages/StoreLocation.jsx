import { ArrowLeft, Clock, MapPin, Navigation, Phone, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StoreMap, { STORE_LOCATION } from "../components/maps/StoreMap.jsx";
import { useStoreLocation } from "../hooks/useStoreStatus.js";
import MapsIcon from "../components/maps/MapsIcon.jsx";

export default function StoreLocation() {
  const navigate = useNavigate();
  const { store } = useStoreLocation();
  const location = store || STORE_LOCATION;
  const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  const hours = location.hours || `${String(location.open_time || "10:00").slice(0, 5)}–${String(location.close_time || "22:00").slice(0, 5)}`;

  return <main className="relative mx-auto w-full max-w-4xl px-3 pt-0 sm:px-4 sm:pt-4">
    <button type="button" onClick={() => navigate(-1)} className="absolute left-5 top-[calc(.75rem+env(safe-area-inset-top))] z-20 grid h-10 w-10 place-items-center border-0 bg-transparent p-0 text-slate-900 shadow-none drop-shadow-[0_1px_1px_rgba(255,255,255,.9)] sm:left-7 sm:top-7" aria-label="Kembali"><ArrowLeft size={21}/></button>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-64 w-full bg-slate-100 xs:h-80 sm:h-[420px]"><StoreMap location={location}/></div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700"><Store size={18}/></span><div><h1 className="text-sm font-bold text-slate-900 sm:text-base">{location.name}</h1><p className="mt-1 flex items-start gap-2 text-[10px] leading-5 text-slate-600 sm:text-xs"><MapPin size={14} className="mt-0.5 shrink-0 text-blue-600"/>{location.address}</p></div></div>
        <div className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
          <p className="flex items-center gap-2 text-[10px] text-slate-600 sm:text-xs"><Clock size={14} className="text-slate-500"/>Jam buka: {hours}</p>
          {location.phone&&<p className="flex items-center gap-2 text-[10px] text-slate-600 sm:text-xs"><Phone size={14} className="text-slate-500"/>{location.phone}</p>}
          <p className="flex items-center gap-2 text-[10px] text-slate-600 sm:text-xs"><Navigation size={14} className="text-slate-500"/>{location.is_open===false?'Toko sedang tutup':location.deliveryArea||'Melayani area sekitar toko'}</p>
        </div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[10px] font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 sm:text-xs"><MapsIcon size={22}/>Buka di Google Maps</a>
      </div>
    </section>
  </main>;
}

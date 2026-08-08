import { useEffect, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { useDashboardStats } from "../../hooks/useDashboardStats.js";
import { updateStoreInfo } from "../../services/dashboardService.js";

export default function MapSettings() {
  const data = useDashboardStats();
  const [store, setStore] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => setStore(data.storeInfo || {}), [data.storeInfo]);
  const save = async (event) => { event.preventDefault(); setSaving(true); setMessage(""); try { await updateStoreInfo(store); setMessage("Koordinat berhasil disinkronkan ke Web dan APK."); } catch (error) { setMessage(error.message); } finally { setSaving(false); } };
  const lat = Number(store.latitude), lng = Number(store.longitude);
  const valid = Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180;
  const mapUrl = valid ? `https://www.google.com/maps?q=${lat},${lng}` : null;
  return <div className="max-w-2xl space-y-4"><div><h1 className="flex items-center gap-2 text-xl font-bold"><MapPin className="text-primary"/>Pengaturan Map</h1><p className="text-sm text-gray-500">Koordinat ini digunakan oleh pencarian lokasi toko di Web dan APK.</p></div>{message&&<p className="rounded-xl border bg-white p-3 text-sm">{message}</p>}<form onSubmit={save} className="space-y-4 rounded-2xl border bg-white p-5"><label className="block text-xs text-gray-500">Alamat lengkap<textarea required maxLength={500} rows={3} value={store.address||""} onChange={e=>setStore({...store,address:e.target.value})} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><div className="grid grid-cols-2 gap-3"><label className="text-xs text-gray-500">Latitude<input required type="number" min="-90" max="90" step="any" value={store.latitude??""} onChange={e=>setStore({...store,latitude:e.target.value===""?null:Number(e.target.value)})} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><label className="text-xs text-gray-500">Longitude<input required type="number" min="-180" max="180" step="any" value={store.longitude??""} onChange={e=>setStore({...store,longitude:e.target.value===""?null:Number(e.target.value)})} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label></div>{mapUrl&&<a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ExternalLink size={15}/>Periksa titik di Google Maps</a>}<button disabled={saving||!valid} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50">{saving?"Menyimpan...":"Simpan Pengaturan Map"}</button></form></div>;
}

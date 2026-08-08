import { useEffect, useState } from "react";
import StoreControlCard from "../../components/dashboard/StoreControlCard.jsx";
import { useDashboardStats } from "../../hooks/useDashboardStats.js";
import { updateStoreInfo } from "../../services/dashboardService.js";

export default function StoreIndex(){
  const data=useDashboardStats();const [store,setStore]=useState({});const [saving,setSaving]=useState(false);const [message,setMessage]=useState("");
  useEffect(()=>setStore(data.storeInfo||{}),[data.storeInfo]);
  const save=async(next=store)=>{setSaving(true);setMessage("");try{await updateStoreInfo(next);setMessage("Lokasi toko tersimpan dan langsung disinkronkan ke Web serta APK.");}catch(error){setMessage(error.message);}finally{setSaving(false);}};
  const toggle=(is_open)=>{const next={...store,is_open};setStore(next);save(next);};
  const connected=data.realtimeStatus==="SUBSCRIBED";
  return <div className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Store Control Center</p><h1 className="mt-1 text-2xl font-bold text-gray-900">Lokasi & Operasional Toko</h1><p className="mt-1 text-sm text-gray-500">Kelola informasi outlet yang otomatis digunakan Dashboard, Web, dan APK.</p></div><div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${connected?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600"}`}><span className={`h-2 w-2 rounded-full ${connected?"animate-pulse bg-emerald-500":"bg-amber-500"}`}/>{connected?"Realtime terhubung":"Menghubungkan realtime"}</div></div>{data.error&&<p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{data.error}</p>}{message&&<p className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<StoreControlCard store={store} saving={saving} onChange={setStore} onSave={()=>save()} onToggle={toggle}/>{data.lastUpdated&&<p className="text-right text-[10px] text-gray-400">Data terakhir diperbarui {data.lastUpdated.toLocaleTimeString("id-ID")}</p>}</div>;
}

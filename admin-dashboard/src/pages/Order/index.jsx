import { useState } from "react";
import RecentOrdersTable from "../../components/dashboard/RecentOrdersTable.jsx";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { updateOrderStatus } from "../../services/dashboardService.js";

export default function OrderIndex(){const orders=useLiveCollection("orders",{order:{column:"created_at",ascending:false}})||[];const [saving,setSaving]=useState(false);const [error,setError]=useState("");const change=async(id,status)=>{setSaving(true);setError("");try{await updateOrderStatus(id,status);}catch(reason){setError(reason.message);}finally{setSaving(false);}};return <div className="space-y-4"><div><h1 className="text-xl font-bold">Semua Pesanan</h1><p className="text-sm text-gray-500">Perubahan status disiarkan realtime ke Web dan APK.</p></div>{error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}<RecentOrdersTable orders={orders} saving={saving} onStatusChange={change}/></div>;}

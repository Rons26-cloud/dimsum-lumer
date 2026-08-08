import { Star, Truck } from "lucide-react";
import NotificationRealtimeMap from "./NotificationRealtimeMap.jsx";

export default function NotificationTracking({metadata={},order}){
  const customer={lat:Number(metadata.customer_lat||order?.customer_lat),lng:Number(metadata.customer_lng||order?.customer_lng)};
  const driver={lat:Number(metadata.driver_lat),lng:Number(metadata.driver_lng)};
  const store={lat:Number(metadata.store_lat),lng:Number(metadata.store_lng)};
  return <section className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
    <NotificationRealtimeMap customer={customer} driver={driver} store={store}/>
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-white"><Truck size={20}/></span>
      <div className="min-w-0 flex-1"><strong className="block truncate text-xs">{metadata.driver_name||'Driver belum ditugaskan'}</strong><span className="flex items-center gap-1 text-[10px] text-gray-500"><Star size={10} fill="currentColor" className="text-amber-400"/>{metadata.driver_rating||'-'} · {metadata.vehicle_number||'-'} · {metadata.vehicle_type||'-'}</span></div>
      <div className="text-right"><span className="block text-[9px] text-gray-400">Estimasi</span><strong className="text-xs text-primary">{metadata.estimated_arrival||'-'}</strong></div>
    </div>
  </section>;
}

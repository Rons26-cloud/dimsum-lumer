import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

let googlePromise;
function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY belum dikonfigurasi."));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!googlePromise) googlePromise = new Promise((resolve, reject) => { const script=document.createElement('script');script.src=`https://maps.googleapis.com/maps/api/js?key=${key}`;script.async=true;script.onload=()=>resolve(window.google.maps);script.onerror=()=>reject(new Error('Google Maps gagal dimuat.'));document.head.appendChild(script); });
  return googlePromise;
}

export default function NotificationRealtimeMap({ customer, driver, store }) {
  const element = useRef(null);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;loadGoogleMaps().then((maps)=>{if(!active||!element.current)return;const points=[customer,driver,store].filter((point)=>point?.lat&&point?.lng);if(!points.length){setError('Koordinat perjalanan belum tersedia.');return;}const map=new maps.Map(element.current,{center:driver||customer||store,zoom:14,disableDefaultUI:true,zoomControl:true,mapId:import.meta.env.VITE_GOOGLE_MAP_ID});const bounds=new maps.LatLngBounds();const entries=[[store,'Toko','#1D1D1D'],[driver,'Driver','#FF7A00'],[customer,'Pelanggan','#25D366']];entries.forEach(([position,title,color])=>{if(!position?.lat||!position?.lng)return;new maps.Marker({map,position,title,icon:{path:maps.SymbolPath.CIRCLE,scale:8,fillColor:color,fillOpacity:1,strokeColor:'#fff',strokeWeight:3}});bounds.extend(position);});if(points.length>1){new maps.Polyline({map,path:points.slice().reverse(),strokeColor:'#FF7A00',strokeOpacity:.85,strokeWeight:5});map.fitBounds(bounds,48);}}).catch((reason)=>setError(reason.message));return()=>{active=false};},[customer?.lat,customer?.lng,driver?.lat,driver?.lng,store?.lat,store?.lng]);
  if(error)return <div className="grid h-64 place-items-center rounded-3xl border border-gray-100 bg-white px-6 text-center text-xs text-gray-500"><div><MapPin className="mx-auto mb-2 text-primary"/><p>{error}</p></div></div>;
  return <div ref={element} className="h-64 w-full rounded-3xl border border-gray-100 bg-white" aria-label="Peta perjalanan realtime"/>;
}

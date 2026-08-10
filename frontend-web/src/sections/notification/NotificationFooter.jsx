import { MessageCircle, Phone, RefreshCw, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { safeExternalUrl } from "../../utils/security.js";
import MapsIcon from "../../components/maps/MapsIcon.jsx";

export default function NotificationFooter({notification,order,onTrack}){
  const meta=notification.metadata||{};
  const phone=String(meta.driver_phone||'').replace(/\D/g,'');
  const wa=phone.startsWith('0')?`62${phone.slice(1)}`:phone;
  const lat=Number(meta.driver_lat);const lng=Number(meta.driver_lng);
  const maps=Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180?`https://www.google.com/maps?q=${lat},${lng}`:'';
  const actions=[
    {label:'Chat Driver',Icon:MessageCircle,url:wa&&`https://wa.me/${wa}`},
    {label:'Telepon',Icon:Phone,url:phone&&`tel:${phone}`},
    {label:'Google Maps',Icon:MapsIcon,url:maps},
    {label:'Lacak',Icon:RefreshCw,onClick:order?.id?onTrack:null},
    {label:'Nilai',Icon:Star,to:order?.id&&`/orders?rate=${order.id}`},
    {label:'Pesan Lagi',Icon:RefreshCw,to:order?.id&&`/orders?reorder=${order.id}`},
  ].map((item)=>item.url?{...item,url:safeExternalUrl(item.url,{allowTel:true})}:item).filter((item)=>item.url||item.to||item.onClick);
  if(!actions.length)return null;
  const style="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-[10px] font-bold text-primary active:bg-gray-50";
  return <footer className="grid grid-cols-2 gap-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">{actions.map(({label,Icon,url,to,onClick})=>to?<Link key={label} to={to} className={style}><Icon size={15}/>{label}</Link>:<button type="button" key={label} onClick={()=>onClick?onClick():window.open(url,url.startsWith('tel:')?'_self':'_blank','noopener,noreferrer')} className={style}><Icon size={15}/>{label}</button>)}</footer>;
}

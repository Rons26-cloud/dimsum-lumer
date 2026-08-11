import { useEffect, useMemo, useState } from "react";
import { Ban, Bike, Car, CheckCircle2, Clock3, CookingPot, Store, Truck } from "lucide-react";
import OrderStatusCard from "../../components/profile/OrderStatusCard.jsx";
const statuses=[['pending','Menunggu',Clock3],['processing','Diproses',CookingPot],['shipping','Dikirim',Truck],['completed','Selesai',CheckCircle2],['cancelled','Dibatalkan',Ban]];

const stages=['pending','processing','shipping','completed'];
const delivery={gojek:{label:'Gojek',Icon:Bike},grab:{label:'Grab',Icon:Car},pickup:{label:'Ambil Sendiri',Icon:Store}};

function OrderTimeline({order,onOpen}){
  if(!order)return null;
  const cancelled=order.status==='cancelled';
  const activeIndex=stages.indexOf(order.status);
  const method=delivery[String(order.shipping_method||'').toLowerCase()]||{label:order.shipping_method||'Pengiriman',Icon:Truck};
  return <button type="button" onClick={onOpen} className={`mt-2 w-full rounded-2xl border p-3 text-left ${cancelled?'border-red-100 bg-red-50/60':'border-emerald-100 bg-emerald-50/40'}`}>
    <div className="mb-3 flex items-center justify-between gap-2"><div className="min-w-0"><span className="block text-[7px] font-semibold uppercase tracking-wider text-gray-400">Pesanan terbaru</span><strong className="block truncate text-[9px] text-gray-900">{order.order_code?`#${order.order_code}`:order.id}</strong></div><span className={`rounded-full px-2 py-1 text-[7px] font-bold ${cancelled?'bg-red-100 text-red-600':'bg-white text-emerald-700'}`}>{cancelled?'Dibatalkan':method.label}</span></div>
    {cancelled?<div className="flex items-center gap-2 text-red-600"><span className="grid h-7 w-7 place-items-center rounded-full bg-red-100"><Ban size={13}/></span><div><strong className="block text-[9px]">Pesanan dibatalkan</strong><span className="text-[7px] text-red-500">{order.cancellation_reason||'Lihat detail pembatalan'}</span></div></div>:<div className="flex items-start">{stages.map((stage,index)=>{const config=statuses.find(([id])=>id===stage);const Icon=stage==='shipping'?method.Icon:config[2];const reached=index<=activeIndex;return <div key={stage} className="relative flex min-w-0 flex-1 flex-col items-center"><div className="flex w-full items-center"><span className={`${index===0?'invisible':''} h-0.5 flex-1 ${index<=activeIndex?'bg-emerald-500':'bg-gray-200'}`}/><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${reached?'border-emerald-500 bg-emerald-500 text-white':'border-gray-200 bg-white text-gray-300'}`}><Icon size={12}/></span><span className={`${index===stages.length-1?'invisible':''} h-0.5 flex-1 ${index<activeIndex?'bg-emerald-500':'bg-gray-200'}`}/></div><span className={`mt-1 truncate text-[6px] font-semibold ${reached?'text-emerald-700':'text-gray-400'}`}>{stage==='shipping'?method.label:config[1]}</span></div>})}</div>}
  </button>;
}

export default function OrderStatusSection({ orders,onSelect,userId }) {
  const latest=orders.latestOrder;
  const storageKey=`dimsum-order-status-seen:${userId||'guest'}`;
  const [seenIds,setSeenIds]=useState(()=>{
    try{return new Set(JSON.parse(localStorage.getItem(storageKey)||'[]'));}catch{return new Set();}
  });

  useEffect(()=>{
    try{setSeenIds(new Set(JSON.parse(localStorage.getItem(storageKey)||'[]')));}catch{setSeenIds(new Set());}
  },[storageKey]);

  const terminalIds=useMemo(()=>({
    completed:orders.orderIdsByStatus?.completed||[],
    cancelled:orders.orderIdsByStatus?.cancelled||[],
  }),[orders.orderIdsByStatus]);

  const markSeen=(status)=>{
    const target=status==='all'?[...terminalIds.completed,...terminalIds.cancelled]:(terminalIds[status]||[]);
    if(!target.length)return;
    setSeenIds(current=>{
      const next=new Set([...current,...target]);
      try{localStorage.setItem(storageKey,JSON.stringify([...next]));}catch{}
      return next;
    });
  };

  const openStatus=(status)=>{
    if(status==='all'||status==='completed'||status==='cancelled')markSeen(status);
    onSelect(status);
  };

  const displayCount=(status)=>{
    if(status!=='completed'&&status!=='cancelled')return orders[status]||0;
    return terminalIds[status].filter(id=>!seenIds.has(id)).length;
  };

  return <section className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm"><div className="mb-1 flex items-center justify-between px-0.5"><h2 className="text-[10px] font-extrabold">Status Pesanan</h2><button onClick={()=>openStatus('all')} className="text-[8px] font-bold text-primary">Lihat semua</button></div><div className="grid grid-cols-5 gap-0.5">{statuses.map(([id,label,Icon])=><OrderStatusCard key={id} icon={id==='shipping'&&latest?((delivery[String(latest.shipping_method||'').toLowerCase()]||{}).Icon||Icon):Icon} label={label} count={displayCount(id)} onClick={()=>openStatus(id)}/>)}</div><OrderTimeline order={latest} onOpen={()=>openStatus(latest?.status||'all')}/></section>;
}

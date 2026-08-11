import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NotificationFilter from "../components/notification/NotificationFilter.jsx";
import NotificationHeader from "../sections/notification/NotificationHeader.jsx";
import NotificationTabs from "../sections/notification/NotificationTabs.jsx";
import NotificationPermission from "../sections/notification/NotificationPermission.jsx";
import NotificationList from "../sections/notification/NotificationList.jsx";
import { useNotification } from "../hooks/useNotification.js";

const orderTypes=new Set(['order','order_confirmed','order_processing','driver_assigned','driver_on_the_way','driver_arrived','order_delivered','order_completed','payment_success','payment_failed']);
const promoTypes=new Set(['flash_sale','voucher','promo','reward_point','wishlist_discount']);
const accountTypes=new Set(['account','member_level','review_reminder']);
const validTabs=new Set(['all','order','promo','system','account']);
const typeOf=(item)=>String(item?.type||'system').toLowerCase();
function category(type){if(orderTypes.has(type))return'order';if(promoTypes.has(type))return'promo';if(accountTypes.has(type))return'account';return'system';}
function destination(item){
  const type=typeOf(item);const meta=item.metadata||{};
  if(['driver_assigned','driver_on_the_way','driver_arrived','order_delivered'].includes(type)&&item.order_id)return `/lacak-pesanan/${item.order_id}`;
  if(orderTypes.has(type))return item.order_id?`/orders?order=${item.order_id}`:'/orders';
  if(type==='flash_sale')return meta.flash_sale_id?`/flash-sale/${meta.flash_sale_id}`:'/promo';
  if(['promo','voucher'].includes(type))return '/promo';
  if(type==='wishlist_discount')return '/wishlist';
  if(type==='reward_point')return '/profil/poin';
  if(type==='member_level')return '/profil';
  if(type==='review_reminder')return item.order_id?`/orders?review=${item.order_id}`:'/orders';
  if(['store_open','store_closed'].includes(type))return '/lokasi-toko';
  if(type==='account')return '/profil/detail';
  return `/notifikasi/${item.id}`;
}

export default function Notification(){
  const navigate=useNavigate();const [params,setParams]=useSearchParams();const api=useNotification();
  const requestedTab=params.get('tab');const tab=validTabs.has(requestedTab)?requestedTab:'all';
  const [search,setSearch]=useState('');const [permissionLoading,setPermissionLoading]=useState(false);const [confirm,setConfirm]=useState(null);const [message,setMessage]=useState('');
  const items=useMemo(()=>api.notifications.filter((item)=>(tab==='all'||category(typeOf(item))===tab)&&`${item.title||''} ${item.message||''}`.toLowerCase().includes(search.toLowerCase())),[api.notifications,tab,search]);
  const changeTab=(nextTab)=>{const next=new URLSearchParams(params);if(nextTab==='all')next.delete('tab');else next.set('tab',nextTab);setParams(next,{replace:true});};
  const execute=async()=>{try{if(confirm?.kind==='all')await api.removeAll();else if(confirm?.item)await api.remove(confirm.item.id);setConfirm(null);setMessage('');}catch(error){setMessage(error.message);}};
  const readAll=async()=>{try{await api.readAll();setMessage('');}catch(error){setMessage(error.message);}};
  const enable=async()=>{try{setPermissionLoading(true);const result=await api.requestPermission();if(result!=='granted')setMessage('Izin notifikasi belum diberikan.');}catch(error){setMessage(error.message);}finally{setPermissionLoading(false);}};
  const open=async(item)=>{try{if(!item.is_read)await api.read(item.id);}finally{navigate(`/notifikasi/${item.id}`);}};
  const goToDestination=async(item)=>{try{if(!item.is_read)await api.read(item.id);}finally{navigate(destination(item));}};
  return <div className="mx-auto min-h-dvh max-w-3xl bg-white text-dark">
    <NotificationHeader onBack={()=>navigate(-1)} onSettings={()=>navigate('/profil/pengaturan-notifikasi')} unreadCount={api.unreadCount} onReadAll={readAll} onDeleteAll={()=>setConfirm({kind:'all'})}/>
    <NotificationTabs value={tab} onChange={changeTab}/>
    <div className="px-3 pb-3"><NotificationFilter value={search} onChange={setSearch}/></div>
    <NotificationPermission permission={typeof window!=='undefined'&&'Notification'in window?window.Notification.permission:'unsupported'} onEnable={enable} loading={permissionLoading}/>
    {(message||api.error)&&<p className="mx-3 mt-3 rounded-xl border border-red-100 bg-white p-3 text-[10px] text-red-600">{message||api.error}</p>}
    <div className="mt-4"><NotificationList items={items} loading={api.loading} onOpen={open} onNavigate={goToDestination} onDelete={(item)=>setConfirm({kind:'single',item})}/></div>
    {confirm&&<div className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-3 sm:place-items-center" onClick={()=>setConfirm(null)}><div role="dialog" aria-modal="true" onClick={(event)=>event.stopPropagation()} className="w-full max-w-sm rounded-3xl bg-white p-5"><h2 className="text-sm font-extrabold">Hapus notifikasi?</h2><p className="mt-2 text-[11px] text-gray-500">{confirm.kind==='all'?'Semua notifikasi akan dihapus permanen.':'Notifikasi ini akan dihapus permanen.'}</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setConfirm(null)} className="h-11 rounded-xl border border-gray-200 bg-white text-xs font-bold">Batal</button><button type="button" onClick={execute} className="h-11 rounded-xl bg-red-600 text-xs font-bold text-white">Hapus</button></div></div></div>}
  </div>;
}

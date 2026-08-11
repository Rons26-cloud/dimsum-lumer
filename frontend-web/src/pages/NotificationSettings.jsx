import { useEffect, useState } from "react";
import { Bell, Check, ChevronRight, CreditCard, Globe2, Info, MonitorSmartphone, PackageCheck, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import ProfilePageHeader from "../components/profile/ProfilePageHeader.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { saveNotificationPermission } from "../services/notificationService.js";
import { getNotificationPreferences, saveNotificationPreferences } from "../utils/notificationPreferences.js";

const channels=[
  {id:"orders",Icon:PackageCheck,title:"Status pesanan",description:"Konfirmasi, proses, pengiriman, penyelesaian, dan pembatalan pesanan."},
  {id:"payments",Icon:CreditCard,title:"Pembayaran",description:"Hasil verifikasi dan perubahan status pembayaran."},
  {id:"promos",Icon:Sparkles,title:"Promo dan reward",description:"Penawaran, voucher, flash sale, dan informasi poin."},
  {id:"account",Icon:ShieldCheck,title:"Akun dan layanan",description:"Keamanan akun, informasi layanan, dan jadwal pemeliharaan."},
];

const permissionMeta={
  granted:{label:"Diizinkan",detail:"Notifikasi perangkat aktif",tone:"bg-emerald-50 text-emerald-700",dot:"bg-emerald-500"},
  denied:{label:"Diblokir",detail:"Aktifkan melalui pengaturan browser",tone:"bg-red-50 text-red-700",dot:"bg-red-500"},
  default:{label:"Belum diizinkan",detail:"Izin perangkat diperlukan",tone:"bg-amber-50 text-amber-700",dot:"bg-amber-500"},
  unsupported:{label:"Tidak tersedia",detail:"Browser tidak mendukung notifikasi",tone:"bg-slate-100 text-slate-600",dot:"bg-slate-400"},
};

function readDeviceInfo(){
  if(typeof navigator==="undefined")return{model:"Perangkat tidak dikenali",os:"Tidak diketahui",browser:"Tidak diketahui",type:"Perangkat"};
  const ua=navigator.userAgent||"";const platform=navigator.userAgentData?.platform||navigator.platform||"";
  const androidModel=ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|;|\))/i)?.[1]?.trim();
  const type=/iPad|Tablet/i.test(ua)?"Tablet":/Mobi|Android|iPhone/i.test(ua)?"Ponsel":"Komputer";
  const os=/iPhone|iPad|iPod/.test(ua)?`iOS ${ua.match(/OS ([\d_]+)/)?.[1]?.replaceAll("_",".")||""}`.trim():/Android/.test(ua)?`Android ${ua.match(/Android\s([\d.]+)/)?.[1]||""}`.trim():/Windows NT 10/.test(ua)?"Windows 10/11":/Mac OS X/.test(ua)?`macOS ${ua.match(/Mac OS X\s([\d_]+)/)?.[1]?.replaceAll("_",".")||""}`.trim():/Linux/.test(ua)?"Linux":platform||"Tidak diketahui";
  const browser=/Edg\//.test(ua)?`Microsoft Edge ${ua.match(/Edg\/([\d.]+)/)?.[1]||""}`:/CriOS|Chrome\//.test(ua)?`Google Chrome ${ua.match(/(?:CriOS|Chrome)\/([\d.]+)/)?.[1]||""}`:/FxiOS|Firefox\//.test(ua)?`Mozilla Firefox ${ua.match(/(?:FxiOS|Firefox)\/([\d.]+)/)?.[1]||""}`:/Safari\//.test(ua)?`Safari ${ua.match(/Version\/([\d.]+)/)?.[1]||""}`:"Browser web";
  const model=androidModel||(/iPad/.test(ua)?"Apple iPad":/iPhone/.test(ua)?"Apple iPhone":/Mac/.test(platform)?"Apple Mac":/Win/.test(platform)?"Windows PC":platform||type);
  return{model,os,browser,type};
}

function Switch({checked,onChange,label,disabled=false}){
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={()=>onChange(!checked)} className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:opacity-40 ${checked?"border-orange-600 bg-orange-600 shadow-sm shadow-orange-200":"border-slate-400 bg-slate-100"}`}><span className={`absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border bg-white shadow-md transition-transform duration-200 ${checked?"translate-x-6 border-orange-100":"translate-x-0.5 border-slate-300"}`}/></button>;
}

export default function NotificationSettings(){
  const{user}=useAuth();
  const supported=typeof window!=="undefined"&&"Notification" in window;
  const[permission,setPermission]=useState(supported?Notification.permission:"unsupported");
  const[preferences,setPreferences]=useState(()=>getNotificationPreferences(user?.id));
  const[busy,setBusy]=useState(false);
  const[notice,setNotice]=useState("");
  const[deviceInfo,setDeviceInfo]=useState(readDeviceInfo);

  useEffect(()=>setPreferences(getNotificationPreferences(user?.id)),[user?.id]);
  useEffect(()=>{let active=true;const uaData=navigator.userAgentData;if(uaData?.getHighEntropyValues)uaData.getHighEntropyValues(["model","platform","platformVersion"]).then((value)=>{if(!active)return;setDeviceInfo((current)=>({...current,model:value.model?.trim()||current.model,os:value.platform?`${value.platform} ${value.platformVersion||""}`.trim():current.os}));}).catch(()=>{});return()=>{active=false};},[]);

  const persist=(next,showNotice=false)=>{
    setPreferences(saveNotificationPreferences(user?.id,next));
    if(showNotice)setNotice("Pengaturan berhasil disimpan.");
  };

  const requestAccess=async()=>{
    if(!supported)return;
    setBusy(true);setNotice("");
    try{
      const result=await Notification.requestPermission();
      setPermission(result);
      if(user)await saveNotificationPermission(user.id,result);
      if(result==="granted")persist({...preferences,device:true},true);
      if(result==="denied")setNotice("Izin diblokir. Ubah izin Notifikasi menjadi Izinkan melalui pengaturan situs pada browser.");
    }catch(error){setNotice(error.message||"Izin notifikasi tidak dapat diperbarui.");}
    finally{setBusy(false);}
  };

  const testNotification=()=>{
    new Notification("Dimsum Lumer",{body:"Notifikasi perangkat berfungsi dengan baik.",icon:"/logo.png",tag:"notification-test"});
    setNotice("Notifikasi percobaan telah dikirim.");
  };

  const meta=permissionMeta[permission]||permissionMeta.default;
  const deviceReady=permission==="granted"&&preferences.device;

  return <div className="min-h-dvh bg-[#f6f7f9] pb-[calc(2rem+env(safe-area-inset-bottom))] text-slate-950"><ProfilePageHeader title="Pengaturan Notifikasi"/><main className="mx-auto max-w-2xl space-y-6 py-5">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-lg shadow-slate-900/10">
      <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15"><Bell size={23}/></span><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-300">Pusat Notifikasi</p><h1 className="mt-1 text-lg font-extrabold tracking-tight">Tetap terhubung dengan pesanan Anda</h1><p className="mt-2 text-xs leading-5 text-slate-300">Atur informasi penting yang dapat dikirim ke perangkat ini.</p></div></div>
    </section>
    <section aria-labelledby="device-heading">
      <div className="mb-3 px-1"><h2 id="device-heading" className="text-sm font-extrabold text-slate-900">Perangkat ini</h2><p className="mt-1 text-xs text-slate-500">Status izin dan pengiriman notifikasi.</p></div>
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5">
        <div className="flex items-center gap-4 p-4 sm:p-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white"><Smartphone size={22}/></span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-extrabold">{deviceInfo.model}</h3><p className="mt-1 truncate text-xs text-slate-500">Perangkat yang sedang login</p></div><span className={`rounded-full border px-3 py-1.5 text-[10px] font-extrabold ${meta.tone}`}>{meta.label}</span></div>
        <div className="grid gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-2 sm:px-5"><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><MonitorSmartphone size={18} className="shrink-0 text-slate-500"/><span className="min-w-0"><small className="block text-[10px] text-slate-400">Sistem dan jenis</small><strong className="mt-0.5 block truncate text-xs text-slate-700">{deviceInfo.os} · {deviceInfo.type}</strong></span></div><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><Globe2 size={18} className="shrink-0 text-slate-500"/><span className="min-w-0"><small className="block text-[10px] text-slate-400">Browser aktif</small><strong className="mt-0.5 block truncate text-xs text-slate-700">{deviceInfo.browser}</strong></span></div><div className="flex items-center gap-2 sm:col-span-2"><span className={`h-2 w-2 rounded-full ${meta.dot}`}/><span className="text-xs font-medium text-slate-600">{meta.detail}</span></div></div>
        {permission==="granted"&&<div className="flex min-h-16 items-center gap-4 border-t border-slate-100 px-4 py-3.5 sm:px-5"><div className="min-w-0 flex-1"><strong className="block text-sm">Tampilkan di perangkat</strong><span className="mt-1 block text-xs leading-4 text-slate-500">Jeda sementara tanpa mengubah izin browser.</span></div><Switch checked={preferences.device} onChange={(value)=>persist({...preferences,device:value},true)} label="Tampilkan notifikasi di perangkat"/></div>}
        {permission!=="granted"&&permission!=="unsupported"&&<button type="button" onClick={requestAccess} disabled={busy} className="flex min-h-16 w-full items-center justify-between border-t border-slate-100 px-4 text-left transition-colors hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 sm:px-5"><span><strong className="block text-sm text-primary">Izinkan notifikasi</strong><span className="mt-1 block text-xs text-slate-500">{busy?"Memproses permintaan...":"Konfirmasi izin melalui browser Anda."}</span></span><ChevronRight size={19} className="text-slate-400"/></button>}
      </div>
    </section>

    <section aria-labelledby="category-heading">
      <div className="mb-3 px-1"><h2 id="category-heading" className="text-sm font-extrabold text-slate-900">Kategori notifikasi</h2><p className="mt-1 text-xs text-slate-500">Pilih informasi yang ingin Anda terima.</p></div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5">{channels.map(({id,Icon,title,description})=><div key={id} className="flex min-h-[76px] items-center gap-4 p-4 sm:px-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-primary"><Icon size={20}/></span><div className="min-w-0 flex-1"><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="mt-1 text-xs leading-[1.45] text-slate-500">{description}</p></div><Switch checked={preferences[id]} onChange={(value)=>persist({...preferences,[id]:value})} label={title}/></div>)}</div>
    </section>

    {permission==="granted"&&<section aria-labelledby="test-heading"><div className="mb-3 px-1"><h2 id="test-heading" className="text-sm font-extrabold text-slate-900">Uji notifikasi</h2></div><button type="button" onClick={testNotification} disabled={!deviceReady} className="flex min-h-[68px] w-full items-center gap-4 rounded-3xl border border-slate-200/80 bg-white px-4 text-left shadow-sm shadow-slate-900/5 transition-colors hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 sm:px-5"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Bell size={20}/></span><span className="min-w-0 flex-1"><strong className="block text-sm">Kirim notifikasi percobaan</strong><span className="mt-1 block text-xs text-slate-500">Pastikan notifikasi tampil dengan benar.</span></span><ChevronRight size={19} className="text-slate-400"/></button></section>}

    {notice&&<div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800"><Check size={17} className="mt-0.5 shrink-0"/><span>{notice}</span></div>}
    <div className="flex items-start gap-3 px-1 text-slate-500"><Info size={16} className="mt-0.5 shrink-0"/><p className="text-[11px] leading-5">Izin perangkat dikelola oleh browser. Pilihan kategori tersimpan pada akun yang sedang digunakan.</p></div>
  </main></div>;
}

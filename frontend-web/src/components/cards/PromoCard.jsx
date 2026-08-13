import { useState } from "react";
import { BadgePercent, CalendarDays, Check, Copy, ShoppingBag, Sparkles, Timer, Users } from "lucide-react";

const money=value=>`Rp${Number(value||0).toLocaleString("id-ID")}`;
const date=value=>value?new Date(value).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}):"Tanpa batas waktu";

export default function PromoCard({promo}){
  const[copied,setCopied]=useState(false);
  const percentage=promo?.discount_type==="percentage";
  const discountLabel=promo?.discount_label||(percentage?`${Number(promo?.discount_value||0).toLocaleString("id-ID")}% OFF`:`HEMAT ${money(promo?.discount_value)}`);
  const remaining=promo?.usage_limit==null?null:Math.max(0,Number(promo.usage_limit)-Number(promo.used_count||0));
  const copy=async()=>{if(!promo?.code)return;try{await navigator.clipboard.writeText(promo.code);setCopied(true);setTimeout(()=>setCopied(false),1800)}catch{setCopied(false)}};

  return <article className="group overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-[0_12px_35px_rgba(15,23,42,.07)]">
    <div className="relative isolate overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 p-5 text-white">
      <span className="absolute -right-10 -top-12 -z-10 h-40 w-40 rounded-full border-[24px] border-white/10"/><span className="absolute -bottom-20 left-1/3 -z-10 h-36 w-36 rounded-full bg-red-500/20"/>
      <div className="flex items-start justify-between gap-3"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.12em]"><Sparkles size={12}/>{promo?.badge||"Promo Pilihan"}</span><span className="rounded-xl bg-white px-3 py-2 text-xs font-black text-orange-700 shadow-sm">{discountLabel}</span></div>
      <h2 className="mt-5 text-xl font-black leading-tight drop-shadow-sm">{promo?.title||"Penawaran Spesial"}</h2><p className="mt-2 text-xs font-medium leading-5 text-white">{promo?.description||"Gunakan voucher ini untuk mendapatkan penawaran khusus pada pesanan Anda."}</p>
    </div>
    <div className="p-5"><h3 className="mb-3 text-sm font-black text-gray-900">Detail penawaran</h3><div className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5"><ShoppingBag size={17} className="text-primary"/><p className="mt-2 font-medium text-gray-600">Minimum belanja</p><strong className="mt-1 block text-gray-950">{Number(promo?.min_purchase||0)>0?money(promo.min_purchase):"Tanpa minimum"}</strong></div><div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5"><BadgePercent size={17} className="text-primary"/><p className="mt-2 font-medium text-gray-600">Maksimum diskon</p><strong className="mt-1 block text-gray-950">{promo?.max_discount?money(promo.max_discount):"Tidak dibatasi"}</strong></div></div>
      <div className="mt-4 space-y-3 border-y border-dashed border-gray-300 py-4 text-[11px] text-gray-700"><p className="flex items-center gap-2"><CalendarDays size={16} className="text-primary"/><span>Periode promo</span><strong className="ml-auto text-right text-gray-950">{promo?.starts_at?date(promo.starts_at):"Sekarang"} – {date(promo?.ends_at)}</strong></p><p className="flex items-center gap-2">{remaining===null?<Timer size={16} className="text-primary"/>:<Users size={16} className="text-primary"/>}<span>{remaining===null?"Kuota promo":"Sisa kuota"}</span><strong className="ml-auto text-gray-950">{remaining===null?"Tersedia":`${remaining.toLocaleString("id-ID")} penggunaan`}</strong></p><p className="flex items-center gap-2"><Users size={16} className="text-primary"/><span>Batas per pengguna</span><strong className="ml-auto text-gray-950">{Number(promo?.usage_limit_per_user||1)} kali</strong></p></div>
      <div className="mt-4 flex items-center gap-2"><div className="min-w-0 flex-1 rounded-2xl border-2 border-orange-200 bg-orange-50 px-4 py-3"><p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">Kode voucher</p><strong className="mt-1 block truncate font-mono text-base tracking-wider text-orange-950">{promo?.code||"PROMO"}</strong></div><button type="button" onClick={copy} className={`inline-flex min-h-[66px] shrink-0 items-center gap-2 rounded-2xl px-5 text-xs font-extrabold text-white transition ${copied?"bg-emerald-600":"bg-gray-950 hover:bg-gray-800"}`}>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?"Tersalin":"Salin"}</button></div>
      <p className="mt-3 text-center text-[10px] font-medium leading-4 text-gray-600">Salin kode lalu masukkan pada bagian voucher saat checkout.</p>
    </div>
  </article>
}

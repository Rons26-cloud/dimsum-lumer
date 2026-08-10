import { Loader2, Tag, X } from 'lucide-react';

export function VoucherSection({code,onCodeChange,onApply,onRemove,promo,error,loading}) {
  return <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card sm:p-5">
    <div className="mb-3 flex items-center gap-2"><Tag size={16} className="text-primary"/><div><h2 className="text-sm font-bold text-dark">Voucher Promo</h2><p className="text-[9px] text-gray-400">Diskon diverifikasi kembali oleh Supabase.</p></div></div>
    {promo?<div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3"><div className="min-w-0"><strong className="block truncate text-xs text-emerald-800">{promo.code} berhasil dipakai</strong><span className="text-[9px] text-emerald-600">{promo.title||'Promo aktif'}</span></div><button type="button" onClick={onRemove} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-gray-500" aria-label="Hapus voucher"><X size={14}/></button></div>:<div className="flex gap-2"><input value={code} onChange={(event)=>onCodeChange(event.target.value.toUpperCase())} onKeyDown={(event)=>{if(event.key==='Enter')onApply();}} placeholder="Masukkan kode promo" className="min-h-11 min-w-0 flex-1 rounded-xl border border-gray-200 px-3 text-xs font-semibold uppercase outline-none focus:border-primary"/><button type="button" onClick={onApply} disabled={loading||!code.trim()} className="min-h-11 rounded-xl bg-gray-950 px-4 text-xs font-bold text-white disabled:bg-gray-200">{loading?<Loader2 size={15} className="animate-spin"/>:'Gunakan'}</button></div>}
    {error&&<p role="alert" className="mt-2 text-[10px] font-medium text-red-600">{error}</p>}
  </section>;
}

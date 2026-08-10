import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Copy, Edit2, Eye, EyeOff, Loader2, Percent, Plus, Search, Sparkles, Tag, Trash2, X } from "lucide-react";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { supabase } from "../../supabase/client.js";
import { formatCurrency } from "../../utils/formatCurrency.js";

const EMPTY = { title: "", description: "", code: "", discount_type: "percentage", discount_value: "", is_active: true };
const fieldClass = "mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const discountLabel = (item) => item.discount_type === "percentage" ? `${Number(item.discount_value || 0).toLocaleString("id-ID")}%` : formatCurrency(item.discount_value);

export default function PromoIndex() {
  const saveLock = useRef(false);
  const livePromos = useLiveCollection("promos", { order: { column: "created_at", ascending: false } });
  const promos = livePromos || [];
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const visible = useMemo(() => promos.filter((item) => `${item.title || ""} ${item.description || ""} ${item.code || ""}`.toLowerCase().includes(query.trim().toLowerCase()) && (status === "all" || (status === "active" ? item.is_active !== false : item.is_active === false))), [promos, query, status]);
  const activeCount = promos.filter((item) => item.is_active !== false).length;

  const showForm = (item = null) => {
    setEditing(item?.id || null);
    setForm(item ? { title: item.title || "", description: item.description || "", code: item.code || "", discount_type: item.discount_type || "percentage", discount_value: String(item.discount_value ?? ""), is_active: item.is_active !== false } : EMPTY);
    setOpen(true); setError(""); setNotice("");
  };
  const save = async (event) => {
    event.preventDefault();
    if (saveLock.current) return;
    saveLock.current = true; setSaving(true); setError(""); setNotice("");
    try {
      const value = Number(form.discount_value);
      if (!form.title.trim()) throw new Error("Judul promo wajib diisi.");
      if (!Number.isFinite(value) || value <= 0) throw new Error("Nilai diskon harus lebih dari 0.");
      if (form.discount_type === "percentage" && value > 100) throw new Error("Diskon persen tidak boleh lebih dari 100%.");
      const payload = { title: form.title.trim(), description: form.description.trim() || null, code: form.code.trim().toUpperCase() || null, discount_type: form.discount_type, discount_value: value, is_active: form.is_active };
      const request = editing ? supabase.from("promos").update(payload).eq("id", editing) : supabase.from("promos").insert(payload);
      const { data, error: requestError } = await request.select("id").maybeSingle();
      if (requestError) {
        const schemaProblem = requestError.code === "PGRST204" || /column|schema cache/i.test(`${requestError.message} ${requestError.details || ""}`);
        const duplicateCode = requestError.code === "23505";
        if (schemaProblem) throw new Error(`Schema tabel promos belum sesuai: ${requestError.message}. Jalankan promo-schema-compat.sql di Supabase SQL Editor.`);
        if (duplicateCode) throw new Error(`Kode promo ${payload.code || "tersebut"} sudah digunakan. Gunakan kode lain.`);
        throw new Error([requestError.message, requestError.details, requestError.hint].filter(Boolean).join(" · "));
      }
      if (!data?.id) throw new Error("Promo tidak tersimpan. Periksa izin admin Supabase.");
      setOpen(false); setEditing(null); setForm(EMPTY); setNotice(editing ? "Promo berhasil diperbarui dan disinkronkan realtime." : "Promo berhasil diterbitkan ke Web dan APK.");
    } catch (reason) { setError(reason.message || "Promo gagal disimpan."); }
    finally { saveLock.current = false; setSaving(false); }
  };
  const toggle = async (item) => {
    setActionId(item.id); setError(""); setNotice("");
    const next = item.is_active === false;
    const { data, error: requestError } = await supabase.from("promos").update({ is_active: next }).eq("id", item.id).select("id").maybeSingle();
    setActionId(null);
    if (requestError) setError(requestError.message); else if (!data) setError("Status tidak berubah. Periksa izin Supabase."); else setNotice(`${item.title} berhasil ${next ? "diaktifkan" : "dinonaktifkan"}.`);
  };
  const remove = async (item) => {
    if (!confirm(`Hapus promo “${item.title}”? Promo langsung hilang dari Web dan APK.`)) return;
    setActionId(item.id); setError(""); setNotice("");
    const { data, error: requestError } = await supabase.from("promos").delete().eq("id", item.id).select("id").maybeSingle();
    setActionId(null);
    if (requestError) setError(requestError.message); else if (!data) setError("Promo tidak terhapus. Periksa izin Supabase."); else setNotice(`${item.title} berhasil dihapus.`);
  };
  const copyCode = async (code) => { if (code) { await navigator.clipboard.writeText(code); setNotice(`Kode ${code} berhasil disalin.`); } };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="flex items-center gap-2 text-xl font-bold"><Percent className="text-primary"/>Promo Pelanggan</h1><p className="mt-1 text-sm text-gray-500">Kelola promo Web dan APK melalui Supabase realtime.</p></div><button onClick={() => showForm()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white"><Plus size={15}/>Tambah Promo</button></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</p>}{notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 size={15}/>{notice}</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Total Promo", promos.length, Tag, "bg-orange-50 text-primary"], ["Promo Aktif", activeCount, Eye, "bg-emerald-50 text-emerald-600"], ["Promo Nonaktif", promos.length-activeCount, EyeOff, "bg-gray-100 text-gray-600"], ["Diskon Persen", promos.filter((item)=>item.discount_type==="percentage").length, Percent, "bg-blue-50 text-blue-600"]].map(([label,value,Icon,color])=><div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><span className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}><Icon size={17}/></span><strong className="mt-3 block text-xl">{value}</strong><p className="text-[11px] text-gray-500">{label}</p></div>)}</div>
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl bg-gray-50 px-3"><Search size={16} className="text-gray-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Cari judul, deskripsi, atau kode..." className="w-full bg-transparent text-sm outline-none"/></label><select value={status} onChange={(e)=>setStatus(e.target.value)} className="min-h-11 rounded-xl border px-3 text-xs font-semibold"><option value="all">Semua status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></div>
    {livePromos===null?<div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-primary"/></div>:visible.length?<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((item)=><article key={item.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-4 text-white shadow-sm"><Sparkles className="absolute -bottom-6 -right-5 text-white/10" size={110}/>{actionId===item.id&&<span className="absolute inset-0 z-20 grid place-items-center bg-white/70"><Loader2 className="animate-spin text-primary"/></span>}<div className="relative"><div className="flex justify-between"><span className="rounded-full bg-white/20 px-2.5 py-1 text-[9px] font-bold">PROMO</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${item.is_active!==false?"bg-emerald-500":"bg-gray-700"}`}>{item.is_active!==false?"AKTIF":"NONAKTIF"}</span></div><h2 className="mt-4 font-extrabold">{item.title}</h2><p className="mt-1 line-clamp-2 min-h-9 text-[11px] leading-[18px] text-orange-50">{item.description||"Promo spesial pelanggan Dimsum Lumer."}</p><div className="mt-4 flex items-center justify-between gap-2 border-t border-white/20 pt-3"><button onClick={()=>copyCode(item.code)} disabled={!item.code} className="inline-flex items-center gap-1 rounded-xl bg-black/20 px-3 py-2 text-[10px] font-bold"><span className="text-white/60">KODE</span> {item.code||"TANPA KODE"}{item.code&&<Copy size={11}/>}</button><strong className="rounded-lg bg-white px-3 py-1.5 text-xs text-orange-600">DISKON {discountLabel(item)}</strong></div><div className="mt-4 grid grid-cols-3 gap-2"><button onClick={()=>showForm(item)} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/15 text-[10px] font-bold"><Edit2 size={13}/>Edit</button><button onClick={()=>toggle(item)} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-white/15 text-[10px] font-bold">{item.is_active!==false?<EyeOff size={13}/>:<Eye size={13}/>} {item.is_active!==false?"Nonaktif":"Aktifkan"}</button><button onClick={()=>remove(item)} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-red-700/40 text-[10px] font-bold"><Trash2 size={13}/>Hapus</button></div></div></article>)}</div>:<div className="rounded-2xl border border-dashed bg-white p-12 text-center text-sm text-gray-400">Promo tidak ditemukan.</div>}
    {open&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6"><div className="flex justify-between"><div><h2 className="font-bold">{editing?"Edit Promo":"Tambah Promo"}</h2><p className="mt-1 text-xs text-gray-500">Perubahan langsung tampil pada Web dan APK.</p></div><button type="button" onClick={()=>setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100"><X size={17}/></button></div><div className="mt-5 space-y-4"><label className="block text-xs font-semibold text-gray-600">Judul promo<input required maxLength={100} value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className={fieldClass}/></label><label className="block text-xs font-semibold text-gray-600">Deskripsi<textarea maxLength={300} rows={4} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className={`${fieldClass} resize-none`}/></label><label className="block text-xs font-semibold text-gray-600">Kode promo<input maxLength={30} value={form.code} onChange={(e)=>setForm({...form,code:e.target.value.toUpperCase().replace(/\s+/g,"")})} className={`${fieldClass} font-mono`}/></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-gray-600">Jenis diskon<select value={form.discount_type} onChange={(e)=>setForm({...form,discount_type:e.target.value})} className={fieldClass}><option value="percentage">Persentase (%)</option><option value="fixed">Nominal Rupiah</option></select></label><label className="text-xs font-semibold text-gray-600">Nilai diskon<input required min="1" max={form.discount_type==="percentage"?"100":undefined} type="number" value={form.discount_value} onChange={(e)=>setForm({...form,discount_value:e.target.value})} className={fieldClass}/></label></div><div className="rounded-xl bg-orange-50 p-3 text-xs"><span className="text-orange-600">Preview</span><strong className="mt-1 block text-base text-primary">{form.discount_value?discountLabel(form):"Belum diisi"}</strong></div><label className="flex items-center justify-between rounded-xl border p-3 text-xs"><span><strong className="block">Promo aktif</strong><span className="text-gray-400">Tampilkan kepada pelanggan.</span></span><input type="checkbox" checked={form.is_active} onChange={(e)=>setForm({...form,is_active:e.target.checked})} className="h-4 w-4 accent-orange-500"/></label><button disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white disabled:opacity-50">{saving&&<Loader2 size={15} className="animate-spin"/>}{editing?"Simpan Perubahan":"Terbitkan Promo"}</button></div></form></div>}
  </div>;
}

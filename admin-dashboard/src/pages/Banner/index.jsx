import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit2, Eye, EyeOff, ImageOff, ImagePlus, Images, Loader2, MonitorSmartphone, Plus, Search, Trash2, X } from "lucide-react";
import { getConfig, updateConfig } from "../../services/dashboardService.js";
import { FRONTEND_BANNERS } from "../../data/frontendBanners.js";
import { subscribeToTable } from "../../supabase/realtime.js";
import { getPublicUrl, uploadFile } from "../../supabase/storage.js";
import { cleanText, safeHttpUrl } from "../../utils/security.js";

const EMPTY = { title: "", subtitle: "", image_url: "", target_url: "/promo", is_active: true, file: null };
const fieldClass = "mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function BannerIndex() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");

  const load = async () => {
    try {
      const value = await getConfig("home_banners", null);
      setItems(Array.isArray(value?.items) && value.items.length > 0 ? value.items : FRONTEND_BANNERS);
      setError("");
    } catch (reason) { setError(reason.message || "Banner gagal dimuat."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    return subscribeToTable("app_config", "*", load, "key=eq.home_banners");
  }, []);

  const visible = useMemo(() => items.filter((item) => `${item.title || ""} ${item.subtitle || ""}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  const activeCount = items.filter((item) => item.is_active !== false).length;
  const frontendCount = items.filter((item) => item.source === "frontend" || String(item.id).startsWith("frontend-")).length;

  const persist = async (next, success) => {
    const normalized = next.map(({ file, ...item }) => ({ ...item, source: item.source === "frontend" ? "frontend" : "supabase" }));
    await updateConfig("home_banners", { items: normalized });
    setItems(normalized);
    setNotice(success);
  };

  const showForm = (item = null) => {
    setEditing(item?.id || null);
    setForm(item ? { title: item.title || "", subtitle: item.subtitle || "", image_url: item.image_url || "", target_url: item.target_url || "/promo", is_active: item.is_active !== false, file: null } : EMPTY);
    setOpen(true); setError(""); setNotice("");
  };

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const title = cleanText(form.title, { field: "Judul", maxLength: 80, required: true });
      let imageUrl = form.image_url || "";
      if (form.file) {
        const extension = form.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `home/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.${extension}`;
        await uploadFile("banners", path, form.file);
        imageUrl = `${getPublicUrl("banners", path)}?v=${Date.now()}`;
      } else if (/^https?:\/\//i.test(imageUrl)) imageUrl = safeHttpUrl(imageUrl, { field: "URL gambar" });
      if (!imageUrl) throw new Error("Gambar banner wajib dipilih.");
      const target = cleanText(form.target_url, { field: "Tujuan", maxLength: 500 }) || "/promo";
      if (!target.startsWith("/") && !/^https:\/\//i.test(target)) throw new Error("Tujuan harus berupa path aplikasi atau URL HTTPS.");
      const payload = { id: editing || crypto.randomUUID(), title, subtitle: cleanText(form.subtitle, { field: "Subjudul", maxLength: 140 }), image_url: imageUrl, target_url: target, is_active: form.is_active, source: "supabase" };
      const next = editing ? items.map((item) => item.id === editing ? payload : item) : [...items, payload];
      await persist(next, editing ? "Banner berhasil diperbarui dan langsung dikirim ke frontend." : "Banner baru berhasil ditambahkan ke frontend.");
      setOpen(false); setEditing(null); setForm(EMPTY);
    } catch (reason) { setError(reason.message || "Banner gagal disimpan."); }
    finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!confirm(`Hapus banner “${item.title}”? Perubahan langsung diterapkan ke frontend.`)) return;
    setActionId(item.id); setError(""); setNotice("");
    try { await persist(items.filter((entry) => entry.id !== item.id), `${item.title} berhasil dihapus dari banner frontend.`); }
    catch (reason) { setError(reason.message || "Banner gagal dihapus."); }
    finally { setActionId(null); }
  };

  const toggle = async (item) => {
    setActionId(item.id); setError(""); setNotice("");
    try { await persist(items.map((entry) => entry.id === item.id ? { ...entry, is_active: entry.is_active === false } : entry), `${item.title} berhasil ${item.is_active === false ? "diaktifkan" : "dinonaktifkan"}.`); }
    catch (reason) { setError(reason.message || "Status banner gagal diubah."); }
    finally { setActionId(null); }
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="flex items-center gap-2 text-xl font-bold text-gray-900"><Images className="text-primary"/>Banner Promo</h1><p className="mt-1 text-sm text-gray-500">Kelola slider utama Web dan APK secara realtime melalui Supabase.</p></div><button type="button" onClick={() => showForm()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-lg shadow-orange-100"><Plus size={15}/>Tambah Banner</button></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</p>}
    {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 size={15}/>{notice}</p>}

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Total Banner", items.length, Images, "bg-orange-50 text-primary"], ["Banner Aktif", activeCount, Eye, "bg-emerald-50 text-emerald-600"], ["Banner Nonaktif", items.length - activeCount, EyeOff, "bg-gray-100 text-gray-600"], ["Sumber Frontend", frontendCount, MonitorSmartphone, "bg-blue-50 text-blue-600"]].map(([label, value, Icon, color]) => <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><span className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}><Icon size={17}/></span><strong className="mt-3 block text-xl">{value}</strong><p className="text-[11px] text-gray-500">{label}</p></div>)}</div>
    <label className="flex min-h-12 max-w-xl items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 shadow-sm"><Search size={16} className="text-gray-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul atau deskripsi banner..." className="w-full bg-transparent text-sm outline-none"/></label>

    {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-primary"/></div> : visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((item, index) => <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="relative aspect-[16/7] overflow-hidden bg-gray-100">{item.image_url ? <img src={item.image_url} alt={item.title} loading="lazy" className="h-full w-full object-cover"/> : <span className="grid h-full place-items-center text-gray-300"><ImageOff size={32}/></span>}<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"/><span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[9px] font-bold text-white">SLIDE {index + 1}</span><span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold text-white ${item.is_active !== false ? "bg-emerald-500" : "bg-gray-600"}`}>{item.is_active !== false ? "AKTIF" : "NONAKTIF"}</span>{actionId === item.id && <span className="absolute inset-0 grid place-items-center bg-white/70"><Loader2 className="animate-spin text-primary"/></span>}<div className="absolute inset-x-0 bottom-0 p-4"><h2 className="font-bold text-white">{item.title}</h2><p className="line-clamp-1 text-[10px] text-white/75">{item.subtitle || "Tanpa subjudul"}</p></div></div><div className="p-4"><div className="grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-xl bg-gray-50 p-3"><span className="text-gray-400">Tujuan</span><strong className="mt-1 block truncate text-gray-700" title={item.target_url}>{item.target_url || "/promo"}</strong></div><div className="rounded-xl bg-blue-50 p-3"><span className="text-blue-500">Penyimpanan</span><strong className="mt-1 block text-blue-700">{item.source === "frontend" ? "Frontend lokal" : "Supabase"}</strong></div></div><div className="mt-3 grid grid-cols-3 gap-2"><button disabled={actionId === item.id} onClick={() => showForm(item)} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-blue-50 text-[10px] font-bold text-blue-600"><Edit2 size={13}/>Edit</button><button disabled={actionId === item.id} onClick={() => toggle(item)} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-gray-100 text-[10px] font-bold text-gray-700">{item.is_active !== false ? <EyeOff size={13}/> : <Eye size={13}/>} {item.is_active !== false ? "Nonaktif" : "Aktifkan"}</button><button disabled={actionId === item.id} onClick={() => remove(item)} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-red-50 text-[10px] font-bold text-red-600"><Trash2 size={13}/>Hapus</button></div></div></article>)}</div> : <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><Images className="mx-auto text-gray-300" size={36}/><h2 className="mt-3 text-sm font-bold">Banner tidak ditemukan</h2><p className="mt-1 text-xs text-gray-400">Tambah banner baru atau ubah kata pencarian.</p></div>}

    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-bold text-gray-900">{editing ? "Edit banner promo" : "Tambah banner promo"}</h2><p className="mt-1 text-xs text-gray-500">Rasio gambar yang disarankan 16:7.</p></div><button type="button" disabled={saving} onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100"><X size={17}/></button></div><div className="mt-5 space-y-4"><label className="block text-xs font-semibold text-gray-600">Judul banner<input required maxLength={80} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={fieldClass} placeholder="Contoh: Promo Dimsum Keluarga"/></label><label className="block text-xs font-semibold text-gray-600">Deskripsi singkat<textarea maxLength={140} rows={3} value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} className={`${fieldClass} resize-none`} placeholder="Jelaskan promo secara singkat."/></label><label className="flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-center text-xs text-gray-500">{form.file ? <><ImagePlus className="mb-2 text-primary"/><strong>{form.file.name}</strong></> : form.image_url ? <img src={form.image_url} alt="Preview banner" className="h-36 w-full object-cover"/> : <><ImagePlus className="mb-2 text-primary"/><strong>Pilih gambar banner</strong><span className="mt-1 text-[10px] text-gray-400">JPG, PNG, atau WebP maksimal 5 MB</span></>}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })}/></label><label className="block text-xs font-semibold text-gray-600">URL gambar alternatif<input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} className={fieldClass} placeholder="https://..."/></label><label className="block text-xs font-semibold text-gray-600">Tujuan saat banner diklik<input value={form.target_url} onChange={(event) => setForm({ ...form, target_url: event.target.value })} className={fieldClass} placeholder="/promo atau /produk"/></label><label className="flex items-center justify-between rounded-xl border p-3 text-xs"><span><strong className="block text-gray-700">Banner aktif</strong><span className="text-gray-400">Tampilkan banner pada frontend.</span></span><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="h-4 w-4 accent-orange-500"/></label><button disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin"/>}{editing ? "Simpan Perubahan" : "Terbitkan Banner"}</button></div></form></div>}
  </div>;
}

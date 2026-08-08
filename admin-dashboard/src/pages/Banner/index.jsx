import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { getConfig, updateConfig } from "../../services/dashboardService.js";
import { getPublicUrl, uploadFile } from "../../supabase/storage.js";
import { cleanText, safeHttpUrl } from "../../utils/security.js";

const EMPTY = { title: "", subtitle: "", image_url: "", target_url: "/promo", is_active: true, file: null };

export default function BannerIndex() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getConfig("home_banners", { items: [] })
      .then((value) => setItems(Array.isArray(value.items) ? value.items : []))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const persist = async (next) => {
    await updateConfig("home_banners", { items: next });
    setItems(next);
    setMessage("Banner tersimpan ke konfigurasi bersama Web dan APK.");
  };

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const title = cleanText(form.title, { field: "Judul", maxLength: 80, required: true });
      let imageUrl = form.image_url ? safeHttpUrl(form.image_url, { field: "URL gambar" }) : null;
      if (form.file) {
        const extension = form.file.name.split(".").pop().toLowerCase();
        const path = `home/banner-${Date.now()}.${extension}`;
        await uploadFile("banners", path, form.file);
        imageUrl = getPublicUrl("banners", path);
      }
      if (!imageUrl) throw new Error("Gambar banner wajib dipilih.");
      const target = cleanText(form.target_url, { field: "Tujuan", maxLength: 500 }) || "/promo";
      if (!target.startsWith("/") && !/^https:\/\//i.test(target)) throw new Error("Tujuan harus berupa path aplikasi atau URL HTTPS.");
      await persist([...items, { id: crypto.randomUUID(), title, subtitle: cleanText(form.subtitle, { field: "Subjudul", maxLength: 140 }), image_url: imageUrl, target_url: target, is_active: form.is_active }]);
      setForm(EMPTY); setOpen(false);
    } catch (error) { setMessage(error.message); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (confirm("Hapus banner ini?")) { setSaving(true); try { await persist(items.filter((item) => item.id !== id)); } catch (error) { setMessage(error.message); } finally { setSaving(false); } } };
  const toggle = async (id) => { setSaving(true); try { await persist(items.map((item) => item.id === id ? { ...item, is_active: !item.is_active } : item)); } catch (error) { setMessage(error.message); } finally { setSaving(false); } };

  return <div className="space-y-4"><div className="flex items-center justify-between"><div><h1 className="text-xl font-bold">Banner Promo</h1><p className="text-sm text-gray-500">Kelola banner beranda untuk Web dan APK.</p></div><button type="button" onClick={()=>setOpen(true)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white"><Plus size={15}/>Tambah</button></div>{message&&<p className="rounded-xl border bg-white p-3 text-sm">{message}</p>}{loading?<Loader2 className="animate-spin text-primary"/>:<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border bg-white"><img src={item.image_url} alt={item.title} className="aspect-[16/7] w-full bg-gray-100 object-cover"/><div className="p-4"><h2 className="font-bold">{item.title}</h2><p className="text-xs text-gray-500">{item.subtitle||item.target_url}</p><div className="mt-3 flex justify-between"><button type="button" disabled={saving} onClick={()=>toggle(item.id)} className={`rounded-full px-3 py-1 text-xs ${item.is_active?'bg-green-50 text-green-600':'bg-gray-100 text-gray-500'}`}>{item.is_active?'Aktif':'Nonaktif'}</button><button type="button" disabled={saving} onClick={()=>remove(item.id)} className="text-red-500"><Trash2 size={16}/></button></div></div></article>)}</div>}{!loading&&!items.length&&<p className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-400">Belum ada banner.</p>}{open&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><form onSubmit={save} className="w-full max-w-md space-y-3 rounded-3xl bg-white p-5"><div className="flex justify-between"><strong>Tambah Banner</strong><button type="button" onClick={()=>setOpen(false)}><X size={18}/></button></div><input required maxLength={80} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Judul banner" className="w-full rounded-xl border p-3"/><textarea maxLength={140} value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})} placeholder="Subjudul" className="w-full rounded-xl border p-3"/><label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-xs text-gray-500"><ImagePlus className="mb-2 text-primary"/>{form.file?.name||"Pilih JPG, PNG, atau WebP (maks. 5 MB)"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e=>setForm({...form,file:e.target.files?.[0]||null})}/></label><input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="Atau URL gambar HTTPS" className="w-full rounded-xl border p-3"/><input value={form.target_url} onChange={e=>setForm({...form,target_url:e.target.value})} placeholder="Tujuan, contoh /promo" className="w-full rounded-xl border p-3"/><label className="flex gap-2 text-xs"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/>Aktif</label><button disabled={saving} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white">{saving&&<Loader2 size={15} className="animate-spin"/>}Simpan</button></form></div>}</div>;
}

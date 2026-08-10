import { useMemo, useState } from "react";
import { Boxes, CheckCircle2, Database, Edit2, Eye, EyeOff, ImageOff, ImagePlus, Loader2, Package, PackageX, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { supabase } from "../../supabase/client.js";
import { getPublicUrl, uploadFile } from "../../supabase/storage.js";
import { FRONTEND_CATALOG, mergeFrontendCatalog } from "../../data/frontendCatalog.js";
import { formatCurrency } from "../../utils/formatCurrency.js";

const EMPTY = { name: "", description: "", price: "", image_url: "", stock: "100", category_id: "", is_active: true, file: null };
const safeName = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const money = formatCurrency;
const fieldClass = "mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function ProductIndex() {
  const products = useLiveCollection("products", { order: { column: "created_at", ascending: false } });
  const categories = useLiveCollection("categories", { order: { column: "name" } });
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [frontendSource, setFrontendSource] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionId, setActionId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => mergeFrontendCatalog(products || []), [products]);
  const visible = useMemo(() => rows.filter((product) => {
    const matchesSearch = `${product.name || ""} ${product.description || ""}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesStatus = status === "all" || (status === "active" ? product.is_active !== false : product.is_active === false);
    return matchesSearch && matchesStatus;
  }), [rows, query, status]);
  const lowStock = rows.filter((product) => Number(product.stock || 0) <= 10).length;
  const frontendOnlyCount = rows.filter((product) => String(product.id || "").startsWith("frontend-")).length;

  const showForm = (product = null) => {
    const isFrontendOnly = String(product?.id || "").startsWith("frontend-");
    setEditing(product && !isFrontendOnly ? product.id : null);
    setFrontendSource(isFrontendOnly);
    setForm(product ? { name: product.name || "", description: product.description || "", price: String(product.price || ""), image_url: product.image_url || product.image || "", stock: String(product.stock ?? 100), category_id: product.category_id ? String(product.category_id) : "", is_active: product.is_active !== false, file: null } : EMPTY);
    setOpen(true); setError(""); setNotice("");
  };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      let imageUrl = form.image_url.trim() || null;
      let uploadSource = form.file;
      if (!uploadSource && frontendSource && form.image_url) {
        const response = await fetch(form.image_url);
        if (!response.ok) throw new Error("Gambar frontend gagal disiapkan untuk upload.");
        const blob = await response.blob();
        uploadSource = new File([blob], `${safeName(form.name)}.jpg`, { type: blob.type || "image/jpeg" });
      }
      if (uploadSource) {
        const extension = uploadSource.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `catalog/${safeName(form.name)}-${Date.now()}.${extension}`;
        await uploadFile("product-images", path, uploadSource);
        imageUrl = getPublicUrl("product-images", path);
      }
      if (!imageUrl) throw new Error("Gambar produk wajib diisi atau diunggah.");
      const payload = { name: form.name.trim(), slug: safeName(form.name), description: form.description.trim() || null, price: Number(form.price), image_url: imageUrl, stock: Number(form.stock), category_id: form.category_id || null, is_active: form.is_active };
      const request = editing ? supabase.from("products").update(payload).eq("id", editing) : supabase.from("products").insert(payload);
      const { error: requestError } = await request;
      if (requestError) throw requestError;
      setOpen(false); setForm(EMPTY); setFrontendSource(false); setNotice(editing ? "Perubahan produk berhasil disimpan dan dikirim realtime." : "Produk berhasil disimpan ke database.");
    } catch (reason) { setError(reason.message); } finally { setSaving(false); }
  };
  const remove = async (product) => {
    if (String(product.id || "").startsWith("frontend-")) {
      setError("Produk bawaan frontend tidak dapat dihapus di sini. Simpan produk ke database terlebih dahulu untuk mengelolanya.");
      return;
    }
    if (!confirm(`Hapus ${product.name} dari katalog pelanggan? Data produk dipertahankan agar riwayat pesanan tetap aman.`)) return;
    setActionId(product.id); setError(""); setNotice("");
    const { error: requestError } = await supabase.from("products").update({ is_active: false, stock: 0 }).eq("id", product.id);
    setActionId(null);
    if (requestError) setError(requestError.message); else setNotice(`${product.name} telah dihapus dari katalog pelanggan.`);
  };
  const updateAvailability = async (product, changes, success) => {
    setActionId(product.id); setError(""); setNotice("");
    const { error: requestError } = await supabase.from("products").update(changes).eq("id", product.id);
    setActionId(null);
    if (requestError) setError(requestError.message); else setNotice(success);
  };
  const syncAllProducts = async () => {
    if (!confirm(`Sinkronkan ${frontendOnlyCount} produk frontend ke database dan Supabase Storage?`)) return;
    setSyncing(true); setSyncProgress(0); setError(""); setNotice("");
    try {
      const existingKeys = new Set((products || []).flatMap((item) => [item.slug, item.name].filter(Boolean).map((value) => safeName(value))));
      const pending = FRONTEND_CATALOG.filter((item) => !existingKeys.has(safeName(item.slug)) && !existingKeys.has(safeName(item.name)));
      for (let index = 0; index < pending.length; index += 1) {
        const item = pending[index];
        const response = await fetch(item.image_url);
        if (!response.ok) throw new Error(`Gambar ${item.name} gagal dibaca.`);
        const blob = await response.blob();
        const file = new File([blob], `${item.slug}.jpg`, { type: blob.type || "image/jpeg" });
        const path = `catalog/${item.slug}-${Date.now()}.jpg`;
        await uploadFile("product-images", path, file);
        const { error: insertError } = await supabase.from("products").insert({ name: item.name, slug: item.slug, description: item.description, price: item.price, image_url: getPublicUrl("product-images", path), stock: item.stock, is_active: true });
        if (insertError) throw insertError;
        setSyncProgress(Math.round(((index + 1) / pending.length) * 100));
      }
      setNotice(pending.length ? `${pending.length} produk berhasil disinkronkan. Semua aksi pengelolaan sekarang tersedia.` : "Semua produk sudah tersimpan di database.");
    } catch (reason) { setError(`Sinkronisasi berhenti: ${reason.message}`); }
    finally { setSyncing(false); }
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="flex items-center gap-2 text-xl font-bold text-gray-900"><Package className="text-primary"/>Katalog Produk</h1><p className="mt-1 text-sm text-gray-500">Produk reguler yang tampil pada Web dan APK pelanggan.</p></div><div className="flex flex-wrap gap-2">{frontendOnlyCount > 0 && <button disabled={syncing} onClick={syncAllProducts} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700 disabled:opacity-50">{syncing ? <Loader2 className="animate-spin" size={15}/> : <Database size={15}/>} {syncing ? `Sinkronisasi ${syncProgress}%` : `Sinkronkan Semua (${frontendOnlyCount})`}</button>}<button onClick={() => showForm()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-lg shadow-orange-100"><Plus size={15}/>Tambah Produk</button></div></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</p>}
    {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 size={15}/>{notice}</p>}

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[["Total Produk", rows.length, "bg-blue-50 text-blue-600"], ["Produk Aktif", rows.filter((item) => item.is_active !== false).length, "bg-emerald-50 text-emerald-600"], ["Stok Menipis", lowStock, "bg-red-50 text-red-600"], ["Total Stok", rows.reduce((sum, item) => sum + Number(item.stock || 0), 0), "bg-orange-50 text-primary"]].map(([label, value, color]) => <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><span className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}><Boxes size={17}/></span><strong className="mt-3 block text-xl text-gray-900">{Number(value).toLocaleString("id-ID")}</strong><p className="text-[11px] text-gray-500">{label}</p></div>)}
    </div>

    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl bg-gray-50 px-3"><Search size={16} className="text-gray-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau deskripsi produk..." className="w-full bg-transparent text-sm outline-none"/></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold"><option value="all">Semua status</option><option value="active">Produk aktif</option><option value="inactive">Produk nonaktif</option></select></div>

    {products === null ? <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-primary"/></div> : visible.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{visible.map((product) => {
      const imageUrl = product.image_url || product.image;
      const isLow = Number(product.stock || 0) <= 10;
      const isFrontendOnly = String(product.id || "").startsWith("frontend-");
      return <article key={product.id} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="relative aspect-[4/3] overflow-hidden bg-gray-100">{imageUrl ? <img src={imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/> : <div className="grid h-full place-items-center text-gray-300"><ImageOff size={32}/></div>}<div className="absolute left-3 top-3 flex flex-wrap gap-1"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold shadow ${product.is_active !== false ? "bg-emerald-500 text-white" : "bg-gray-700 text-white"}`}>{product.is_active !== false ? "AKTIF" : "NONAKTIF"}</span>{isFrontendOnly && <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[9px] font-bold text-white shadow">FRONTEND</span>}</div>{actionId === product.id && <span className="absolute inset-0 grid place-items-center bg-white/70"><Loader2 className="animate-spin text-primary"/></span>}</div><div className="p-4"><div className="flex items-start justify-between gap-3"><h2 className="line-clamp-2 font-bold leading-5 text-gray-900">{product.name}</h2><strong className="shrink-0 text-sm text-primary">{money(product.price)}</strong></div><p className="mt-2 line-clamp-3 min-h-[54px] text-[11px] leading-[18px] text-gray-500">{product.description || "Belum ada deskripsi produk."}</p><div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-[11px]"><span className="text-gray-500">Stok tersedia</span><strong className={isLow ? "text-red-500" : "text-gray-800"}>{Number(product.stock || 0).toLocaleString("id-ID")} {isLow && "· Menipis"}</strong></div>{isFrontendOnly ? <button onClick={() => showForm(product)} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white"><Plus size={14}/>Edit & Simpan ke Database</button> : <div className="mt-3 grid grid-cols-2 gap-2"><button disabled={actionId === product.id} onClick={() => showForm(product)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-50 text-xs font-bold text-blue-600 disabled:opacity-50"><Edit2 size={14}/>Edit Detail</button><button disabled={actionId === product.id} onClick={() => updateAvailability(product, { stock: Number(product.stock || 0) === 0 ? 100 : 0 }, Number(product.stock || 0) === 0 ? `${product.name} tersedia kembali.` : `${product.name} ditandai habis.`)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-amber-50 text-xs font-bold text-amber-700 disabled:opacity-50">{Number(product.stock || 0) === 0 ? <RefreshCw size={14}/> : <PackageX size={14}/>} {Number(product.stock || 0) === 0 ? "Restock" : "Bikin Habis"}</button><button disabled={actionId === product.id} onClick={() => updateAvailability(product, { is_active: product.is_active === false }, product.is_active === false ? `${product.name} diaktifkan kembali.` : `${product.name} disembunyikan dari pelanggan.`)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-700 disabled:opacity-50">{product.is_active === false ? <Eye size={14}/> : <EyeOff size={14}/>} {product.is_active === false ? "Aktifkan" : "Nonaktifkan"}</button><button disabled={actionId === product.id} onClick={() => remove(product)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-bold text-red-600 disabled:opacity-50"><Trash2 size={14}/>Hapus</button></div>}</div></article>;
    })}</div> : <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><Package className="mx-auto text-gray-300" size={34}/><h2 className="mt-3 text-sm font-bold">Produk tidak ditemukan</h2><p className="mt-1 text-xs text-gray-400">Ubah pencarian atau tambahkan produk reguler baru.</p></div>}

    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-bold text-gray-900">{editing ? "Edit detail produk" : "Tambah produk reguler"}</h2><p className="mt-1 text-xs text-gray-500">Informasi ini akan tampil pada Web dan APK.</p></div><button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100"><X size={17}/></button></div><div className="mt-5 space-y-4"><label className="block text-xs font-semibold text-gray-600">Nama produk<input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass}/></label><label className="block text-xs font-semibold text-gray-600">Kategori produk<select required value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })} className={fieldClass}><option value="">Pilih kategori produk</option>{(categories || []).filter((category) => category.is_active !== false).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><span className="mt-1 block text-[10px] font-normal text-gray-400">Produk otomatis tampil di halaman Kategori setelah disimpan.</span></label><label className="block text-xs font-semibold text-gray-600">Deskripsi produk<textarea required maxLength={500} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${fieldClass} resize-none`} placeholder="Jelaskan isi, rasa, jumlah, atau keunggulan produk."/></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-gray-600">Harga jual<input required min="1" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={fieldClass}/></label><label className="text-xs font-semibold text-gray-600">Stok<input required min="0" type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className={fieldClass}/></label></div><label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-center text-xs text-gray-500"><ImagePlus className="mb-2 text-primary"/><strong>{form.file?.name || "Pilih gambar produk"}</strong><span className="mt-1 text-[10px] text-gray-400">JPG, PNG, atau WebP maksimal 5 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })}/></label><label className="block text-xs font-semibold text-gray-600">URL gambar alternatif<input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} className={fieldClass} placeholder="https://..."/></label><label className="flex items-center justify-between rounded-xl border p-3 text-xs"><span><strong className="block text-gray-700">Produk aktif</strong><span className="text-gray-400">Tampilkan produk kepada pelanggan.</span></span><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="h-4 w-4 accent-orange-500"/></label><button disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin"/>}{editing ? "Simpan Perubahan" : "Terbitkan Produk"}</button></div></form></div>}
  </div>;
}

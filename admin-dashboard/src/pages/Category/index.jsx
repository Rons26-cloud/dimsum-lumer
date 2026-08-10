import { useMemo, useState } from "react";
import { Boxes, Edit2, FolderOpen, ImageOff, ImagePlus, Loader2, Package, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { supabase } from "../../supabase/client.js";
import { getPublicUrl, uploadFile } from "../../supabase/storage.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { mergeFrontendCatalog } from "../../data/frontendCatalog.js";

const EMPTY = { name: "", image_url: "", file: null };
const slugify = (value) => String(value || "").trim().toLowerCase().replace("mozarella", "mozzarella").replace("ayam premium", "ayampremium").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const money = formatCurrency;
const productImage = (product) => product.image_url || product.image || product.gambar || product.thumbnail_url || product.images?.[0]?.url || product.images?.[0] || "";
const belongsToCategory = (product, category) => {
  const categoryKeys = [category.id, category.name, category.slug].filter(Boolean).map((value) => slugify(value));
  const productKeys = [product.category_id, product.kategori_id, product.category_name, product.kategori, product.category?.id, product.category?.name, product.category?.slug].filter(Boolean).map((value) => slugify(value));
  return productKeys.some((key) => categoryKeys.includes(key));
};
const fieldClass = "mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function CategoryIndex() {
  const categories = useLiveCollection("categories", { order: { column: "name" } });
  const products = useLiveCollection("products", { order: { column: "name" } });
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");

  const categoryRows = categories || [];
  const productRows = useMemo(() => mergeFrontendCatalog(products || []), [products]);
  const enriched = useMemo(() => categoryRows.map((category) => ({
    ...category,
    products: productRows.filter((product) => belongsToCategory(product, category)),
  })), [categoryRows, productRows]);
  const visible = useMemo(() => enriched.filter((category) => `${category.name || ""} ${category.slug || ""}`.toLowerCase().includes(query.trim().toLowerCase())), [enriched, query]);
  const uncategorized = productRows.filter((product) => !product.category_id);
  const usedCategories = enriched.filter((category) => category.products.length > 0).length;

  const show = (item = null) => {
    setEditing(item?.id || null);
    setForm(item ? { name: item.name || "", image_url: item.image_url || item.icon_url || "", file: null } : EMPTY);
    setOpen(true); setError(""); setNotice("");
  };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const name = form.name.trim();
      if (name.length < 2) throw new Error("Nama kategori minimal 2 karakter.");
      let imageUrl = form.image_url.trim() || null;
      if (form.file) {
        const extension = form.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${slugify(name)}-${Date.now()}.${extension}`;
        await uploadFile("category-images", path, form.file);
        imageUrl = `${getPublicUrl("category-images", path)}?v=${Date.now()}`;
      }
      const payload = { name, slug: slugify(name), image_url: imageUrl, icon_url: imageUrl };
      const request = editing ? supabase.from("categories").update(payload).eq("id", editing).select("id").single() : supabase.from("categories").insert(payload).select("id").single();
      const { data: saved, error: requestError } = await request;
      if (requestError) throw requestError;
      if (!saved?.id) throw new Error("Kategori tidak tersimpan. Periksa izin akun admin.");
      setOpen(false); setForm(EMPTY); setNotice(editing ? "Kategori berhasil diperbarui secara realtime." : "Kategori baru berhasil ditambahkan.");
    } catch (reason) { setError(reason.message || "Kategori gagal disimpan."); } finally { setSaving(false); }
  };
  const remove = async (item) => {
    const count = item.products?.length || 0;
    const prompt = count ? `Kategori ${item.name} memiliki ${count} produk. Hapus kategori dan jadikan produk tersebut tanpa kategori?` : `Hapus kategori ${item.name}?`;
    if (!confirm(prompt)) return;
    setActionId(item.id); setError(""); setNotice("");
    const { data: removed, error: requestError } = await supabase.from("categories").delete().eq("id", item.id).select("id").maybeSingle();
    setActionId(null);
    if (requestError) setError(requestError.message);
    else if (!removed) setError("Kategori tidak terhapus. Periksa policy admin Supabase.");
    else setNotice(`Kategori ${item.name} berhasil dihapus.`);
  };
  const removeProductFromCategory = async (product, category) => {
    if (!confirm(`Keluarkan ${product.name} dari kategori ${category.name}? Produk tetap tersedia di katalog.`)) return;
    setActionId(product.id); setError(""); setNotice("");
    const { data: updated, error: requestError } = await supabase.from("products").update({ category_id: null }).eq("id", product.id).select("id").maybeSingle();
    setActionId(null);
    if (requestError) setError(requestError.message);
    else if (!updated) setError("Produk tidak dapat dikeluarkan. Periksa izin admin Supabase.");
    else setNotice(`${product.name} berhasil dikeluarkan dari kategori ${category.name}.`);
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="flex items-center gap-2 text-xl font-bold text-gray-900"><Tag className="text-primary"/>Kategori Produk</h1><p className="mt-1 text-sm text-gray-500">Kelompokkan produk berdasarkan data katalog Supabase secara realtime.</p></div><button onClick={() => show()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-lg shadow-orange-100"><Plus size={15}/>Tambah Kategori</button></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</p>}

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[["Total Kategori", categoryRows.length, Tag, "bg-orange-50 text-primary"], ["Kategori Terpakai", usedCategories, FolderOpen, "bg-emerald-50 text-emerald-600"], ["Total Produk", productRows.length, Package, "bg-blue-50 text-blue-600"], ["Tanpa Kategori", uncategorized.length, Boxes, "bg-amber-50 text-amber-600"]].map(([label, value, Icon, color]) => <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><span className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}><Icon size={17}/></span><strong className="mt-3 block text-xl">{Number(value).toLocaleString("id-ID")}</strong><p className="text-[11px] text-gray-500">{label}</p></div>)}
    </div>

    <label className="flex min-h-12 max-w-xl items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 shadow-sm"><Search size={16} className="text-gray-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama kategori..." className="w-full bg-transparent text-sm outline-none"/></label>

    {categories === null || products === null ? <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-primary"/></div> : visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => {
      const image = item.image_url || item.icon_url || productImage(item.products[0] || {});
      const activeProducts = item.products.filter((product) => product.is_active !== false);
      return <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
        <div className="relative aspect-[16/7] overflow-hidden bg-orange-50">{image ? <img src={image} alt={item.name} loading="lazy" className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-orange-200"><Tag size={36}/></div>}<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10"><h2 className="text-base font-bold text-white">{item.name}</h2><p className="text-[10px] text-white/70">/{item.slug || slugify(item.name)}</p></div>{actionId === item.id && <span className="absolute inset-0 grid place-items-center bg-white/70"><Loader2 className="animate-spin text-primary"/></span>}</div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-gray-50 p-3"><span className="text-[9px] text-gray-400">Total produk</span><strong className="mt-1 block text-sm">{item.products.length}</strong></div><div className="rounded-xl bg-emerald-50 p-3"><span className="text-[9px] text-emerald-600">Produk aktif</span><strong className="mt-1 block text-sm text-emerald-700">{activeProducts.length}</strong></div></div>
          <div className="mt-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Produk dalam kategori</p>{item.products.length ? <div className="mt-2 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1">{item.products.map((product) => {
            const productImageUrl = productImage(product);
            return <div key={product.id} className="group/product overflow-hidden rounded-xl border border-gray-100 bg-white">
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">{productImageUrl ? <img src={productImageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.nextElementSibling?.classList.remove("hidden"); }}/> : null}<span className={`${productImageUrl ? "hidden" : ""} absolute inset-0 grid place-items-center text-gray-300`}><ImageOff size={22}/></span><span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[8px] font-bold text-white ${product.is_active !== false ? "bg-emerald-500" : "bg-gray-500"}`}>{product.is_active !== false ? "AKTIF" : "NONAKTIF"}</span></div>
              <div className="p-2.5"><p className="truncate text-[11px] font-bold text-gray-800" title={product.name}>{product.name}</p><p className="mt-1 line-clamp-2 min-h-7 text-[9px] leading-3.5 text-gray-400">{product.description || "Belum ada deskripsi produk."}</p><div className="mt-2 flex items-center justify-between gap-2"><p className="text-[10px] font-semibold text-primary">{money(product.price)}</p><span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${Number(product.stock || 0) > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>Stok {Number(product.stock || 0).toLocaleString("id-ID")}</span></div><button disabled={actionId === product.id || String(product.id).startsWith("frontend-")} onClick={() => removeProductFromCategory(product, item)} className="mt-2 inline-flex min-h-8 w-full items-center justify-center gap-1 rounded-lg bg-red-50 px-2 text-[9px] font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-50">{actionId === product.id ? <Loader2 size={11} className="animate-spin"/> : <X size={11}/>}Keluarkan</button></div>
            </div>;
          })}</div> : <div className="mt-2 rounded-xl border border-dashed p-4 text-center text-[10px] text-gray-400">Belum ada produk dalam kategori ini.</div>}</div>
          <div className="mt-4 grid grid-cols-2 gap-2"><button disabled={actionId === item.id} onClick={() => show(item)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-50 text-xs font-bold text-blue-600 disabled:opacity-50"><Edit2 size={14}/>Edit Detail</button><button disabled={actionId === item.id} onClick={() => remove(item)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-bold text-red-600 disabled:opacity-50"><Trash2 size={14}/>Hapus</button></div>
        </div>
      </article>;
    })}</div> : <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><FolderOpen className="mx-auto text-gray-300" size={36}/><h2 className="mt-3 text-sm font-bold">Kategori tidak ditemukan</h2><p className="mt-1 text-xs text-gray-400">Ubah pencarian atau tambahkan kategori baru.</p></div>}

    {uncategorized.length > 0 && <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><h2 className="flex items-center gap-2 text-sm font-bold text-amber-800"><Boxes size={17}/>{uncategorized.length} produk belum memiliki kategori</h2><p className="mt-1 text-xs text-amber-700">Edit produk dari menu Produk dan pilih category_id agar katalog pelanggan lebih terstruktur.</p><div className="mt-3 flex flex-wrap gap-2">{uncategorized.slice(0, 8).map((product) => <span key={product.id} className="rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-amber-800">{product.name}</span>)}</div></section>}

    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-bold text-gray-900">{editing ? "Edit kategori" : "Tambah kategori"}</h2><p className="mt-1 text-xs text-gray-500">Nama dan gambar akan tampil pada Web dan APK.</p></div><button type="button" disabled={saving} onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100 disabled:opacity-50"><X size={17}/></button></div><div className="mt-5 space-y-4"><label className="block text-xs font-semibold text-gray-600">Nama kategori<input required minLength={2} maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contoh: Dimsum Kukus" className={fieldClass}/><span className="mt-1 block text-[9px] font-normal text-gray-400">Slug otomatis: /{slugify(form.name) || "nama-kategori"}</span></label><label className="flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-center text-xs text-gray-500">{form.file ? <><ImagePlus className="mb-2 text-primary"/><strong>{form.file.name}</strong></> : form.image_url ? <img src={form.image_url} alt="Preview kategori" className="h-36 w-full object-cover"/> : <><ImagePlus className="mb-2 text-primary"/><strong>Pilih gambar kategori</strong><span className="mt-1 text-[10px] text-gray-400">JPG, PNG, atau WebP maksimal 5 MB</span></>}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })}/></label><label className="block text-xs font-semibold text-gray-600">URL gambar alternatif<input type="url" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} placeholder="https://..." className={fieldClass}/></label><button disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin"/>}{editing ? "Simpan Perubahan" : "Tambahkan Kategori"}</button></div></form></div>}
  </div>;
}

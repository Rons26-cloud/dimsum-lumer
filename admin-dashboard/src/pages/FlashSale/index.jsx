import { useMemo, useState } from "react";
import { Clock3, Edit2, Flame, ImageOff, Loader2, Plus, Tag, Trash2, X, Zap } from "lucide-react";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { supabase } from "../../supabase/client.js";
import { FRONTEND_FLASH_SALE_CATALOG } from "../../data/frontendFlashSaleCatalog.js";
import { formatCurrency } from "../../utils/formatCurrency.js";

const datetime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const money = formatCurrency;
const EMPTY = () => ({ product_id: "", sale_price: "", original_price: "", flash_stock: "10", starts_at: datetime(new Date()), ends_at: datetime(Date.now() + 86400000), is_active: true });
const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const readableError = (error) => {
  const message = error?.message || "Campaign Flash Sale gagal disimpan.";
  if (error?.code === "23505" || /duplicate|unique/i.test(message)) return "Produk ini sudah memiliki campaign Flash Sale aktif. Edit atau nonaktifkan campaign lama terlebih dahulu.";
  if (error?.code === "42501" || /row-level security|permission denied|policy/i.test(message)) return "Akun ini belum memiliki izin mengubah Flash Sale. Pastikan role profil adalah admin/superadmin dan policy admin Supabase sudah diterapkan.";
  if (error?.code === "23514" || /check constraint/i.test(message)) return "Harga, stok, atau periode Flash Sale tidak memenuhi aturan database.";
  const detail = error?.details || error?.hint;
  return detail ? `${message} (${detail})` : `${message}${error?.code ? ` [${error.code}]` : ""}`;
};

let flashSaleSchemaPromise;
function detectFlashSaleSchema() {
  if (!flashSaleSchemaPromise) {
    flashSaleSchemaPromise = supabase.from("flash_sales").select("original_price").limit(1)
      .then(({ error }) => (/original_price|schema cache|PGRST204/i.test(`${error?.code || ""} ${error?.message || ""}`) ? "legacy" : "modern"));
  }
  return flashSaleSchemaPromise;
}

export default function FlashSaleIndex() {
  const sales = useLiveCollection("flash_sales", { select: "*, products(id,name,description,image_url,image,price)", order: { column: "ends_at" } });
  const products = useLiveCollection("products", { filters: { is_active: true }, order: { column: "name" } });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const now = Date.now();
  const rows = (sales || []).map((sale) => ({
    ...sale,
    sale_price: sale.sale_price ?? sale.discount_price ?? 0,
    original_price: sale.original_price ?? sale.products?.price ?? 0,
    flash_stock: sale.flash_stock ?? sale.stock ?? 0,
  }));
  const activeCount = rows.filter((sale) => sale.is_active && new Date(sale.starts_at).getTime() <= now && new Date(sale.ends_at).getTime() > now).length;
  const scheduledCount = rows.filter((sale) => sale.is_active && new Date(sale.starts_at).getTime() > now).length;

  const frontendSpecials = useMemo(() => FRONTEND_FLASH_SALE_CATALOG.map((special) => {
    const product = (products || []).find((item) => normalize(item.name).includes(normalize(special.name)) || normalize(special.name).includes(normalize(item.name)));
    return { ...special, product };
  }), [products]);

  const show = (sale = null, template = null) => {
    setEditing(sale?.id || null);
    if (sale) setForm({ product_id: sale.product_id, sale_price: String(sale.sale_price), original_price: String(sale.original_price), flash_stock: String(sale.flash_stock), starts_at: datetime(sale.starts_at), ends_at: datetime(sale.ends_at), is_active: sale.is_active });
    else if (template) setForm({ ...EMPTY(), product_id: template.product?.id || "", sale_price: String(template.sale_price), original_price: String(template.product?.price || template.original_price), flash_stock: "10" });
    else setForm(EMPTY());
    setOpen(true); setError(""); setNotice("");
  };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const salePrice = Number(form.sale_price); const originalPrice = Number(form.original_price);
      const startsAt = new Date(form.starts_at); const endsAt = new Date(form.ends_at);
      if (salePrice <= 0 || salePrice >= originalPrice) throw new Error("Harga Flash Sale harus lebih rendah dari harga normal.");
      if (!Number.isInteger(Number(form.flash_stock)) || Number(form.flash_stock) < 1) throw new Error("Stok Flash Sale minimal 1.");
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) throw new Error("Tanggal mulai dan selesai belum valid.");
      if (endsAt <= startsAt) throw new Error("Waktu selesai harus setelah waktu mulai.");
      if (form.is_active && rows.some((sale) => sale.id !== editing && sale.product_id === form.product_id && sale.is_active)) throw new Error("Produk ini sudah memiliki campaign Flash Sale aktif. Edit atau nonaktifkan campaign lama terlebih dahulu.");
      const schema = await detectFlashSaleSchema();
      const payload = schema === "legacy" ? {
          product_id: form.product_id,
          discount_price: salePrice,
          stock: Number(form.flash_stock),
          flash_stock: Number(form.flash_stock),
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          is_active: form.is_active,
        } : {
          product_id: form.product_id,
          sale_price: salePrice,
          original_price: originalPrice,
          flash_stock: Number(form.flash_stock),
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          is_active: form.is_active,
        };
      const request = editing
        ? supabase.from("flash_sales").update(payload).eq("id", editing).select("id").single()
        : supabase.from("flash_sales").insert(payload).select("id").single();
      const { data: saved, error: requestError } = await request;
      if (requestError) console.error("[FlashSale] Supabase menolak penyimpanan", { schema, code: requestError.code, message: requestError.message, details: requestError.details, hint: requestError.hint });
      if (requestError) throw requestError;
      if (!saved?.id) throw new Error("Perubahan tidak diterapkan. Periksa izin akun admin di Supabase.");
      setOpen(false);
      setNotice(editing ? "Campaign Flash Sale berhasil diperbarui dan disinkronkan realtime." : "Campaign Flash Sale berhasil dibuat.");
    } catch (reason) { setError(readableError(reason)); } finally { setSaving(false); }
  };
  const remove = async (id) => {
    if (!confirm("Hapus campaign Flash Sale ini? Produk regulernya tidak akan ikut terhapus.")) return;
    setError(""); setNotice("");
    const { data: removed, error: requestError } = await supabase.from("flash_sales").delete().eq("id", id).select("id").maybeSingle();
    if (requestError) setError(readableError(requestError));
    else if (!removed) setError("Campaign tidak terhapus. Periksa izin akun admin.");
    else setNotice("Campaign Flash Sale berhasil dihapus.");
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="flex items-center gap-2 text-xl font-bold text-gray-900"><Zap className="text-amber-500" fill="currentColor"/>Flash Sale Khusus</h1><p className="mt-1 text-sm text-gray-500">Campaign promo terbatas yang tampil pada jalur Flash Sale frontend.</p></div><button onClick={() => show()} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-xs font-bold text-white"><Plus size={15}/>Buat Campaign</button></div>
    {error && <p role="alert" className={`${open ? "fixed left-1/2 top-4 z-[60] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 shadow-xl" : ""} rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-600`}>{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</p>}
    <div className="grid grid-cols-3 gap-3">{[["Total Campaign", rows.length], ["Sedang Aktif", activeCount], ["Terjadwal", scheduledCount]].map(([label, value], index) => <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><span className={`grid h-9 w-9 place-items-center rounded-xl ${index === 1 ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{index === 1 ? <Flame size={17}/> : <Clock3 size={17}/>}</span><strong className="mt-3 block text-xl">{value}</strong><p className="text-[10px] text-gray-500 sm:text-xs">{label}</p></div>)}</div>

    <section className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 font-bold text-gray-900"><Flame className="text-red-500" size={18}/>Materi Khusus dari Frontend</h2><p className="mt-1 text-xs text-gray-500">Empat gambar ini hanya digunakan untuk jalur Flash Sale, bukan katalog produk reguler.</p></div><span className="hidden rounded-full bg-white px-3 py-1 text-[10px] font-bold text-amber-700 sm:block">SUMBER FRONTEND</span></div><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{frontendSpecials.map((special) => <article key={special.name} className="overflow-hidden rounded-2xl border border-white bg-white shadow-sm"><div className="relative aspect-square overflow-hidden bg-gray-100"><img src={special.image_url} alt={special.name} className="h-full w-full object-cover"/><span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-[8px] font-bold text-white">FLASH SALE</span></div><div className="p-3"><h3 className="line-clamp-2 min-h-9 text-xs font-bold">{special.name}</h3><p className="mt-1 line-clamp-2 min-h-8 text-[9px] leading-4 text-gray-500">{special.description}</p><div className="mt-2"><span className="block text-[9px] text-gray-400 line-through">{money(special.original_price)}</span><strong className="text-xs text-red-500">{money(special.sale_price)}</strong></div><button disabled={!special.product} onClick={() => show(null, special)} className="mt-3 w-full rounded-lg bg-gray-900 py-2 text-[9px] font-bold text-white disabled:bg-gray-100 disabled:text-gray-400">{special.product ? "Gunakan untuk Campaign" : "Produk belum ada di database"}</button></div></article>)}</div></section>

    <section><div className="mb-3"><h2 className="font-bold text-gray-900">Campaign Flash Sale</h2><p className="text-xs text-gray-500">Hanya item pada daftar ini yang dipublikasikan sebagai Flash Sale.</p></div>{sales === null ? <div className="grid min-h-44 place-items-center"><Loader2 className="animate-spin text-primary"/></div> : rows.length ? <div className="grid gap-3 lg:grid-cols-2">{rows.map((sale) => {
      const product = sale.products || {}; const image = product.image_url || product.image;
      const discount = Number(sale.original_price) > 0 ? Math.round((1 - Number(sale.sale_price) / Number(sale.original_price)) * 100) : 0;
      const expired = new Date(sale.ends_at).getTime() <= now;
      return <article key={sale.id} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"><div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100">{image ? <img src={image} alt={product.name || "Flash Sale"} className="h-full w-full object-cover"/> : <span className="grid h-full place-items-center text-gray-300"><ImageOff size={24}/></span>}<span className="absolute left-1.5 top-1.5 rounded-full bg-red-500 px-2 py-1 text-[8px] font-bold text-white">-{discount}%</span></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="line-clamp-1 text-sm font-bold">{product.name || "Produk tidak ditemukan"}</h3><span className={`mt-1 inline-block rounded-full px-2 py-1 text-[8px] font-bold ${expired || !sale.is_active ? "bg-gray-100 text-gray-500" : "bg-emerald-50 text-emerald-600"}`}>{expired ? "BERAKHIR" : sale.is_active ? "AKTIF" : "NONAKTIF"}</span></div><div className="flex gap-1"><button onClick={() => show(sale)} className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600"><Edit2 size={13}/></button><button onClick={() => remove(sale.id)} className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600"><Trash2 size={13}/></button></div></div><div className="mt-2 flex items-end gap-2"><strong className="text-sm text-red-500">{money(sale.sale_price)}</strong><span className="text-[9px] text-gray-400 line-through">{money(sale.original_price)}</span></div><div className="mt-2 flex flex-wrap gap-2 text-[9px] text-gray-500"><span className="rounded-lg bg-gray-50 px-2 py-1">Stok {sale.flash_stock}</span><span className="rounded-lg bg-gray-50 px-2 py-1">Selesai {new Date(sale.ends_at).toLocaleString("id-ID")}</span></div></div></article>;
    })}</div> : <div className="rounded-2xl border border-dashed bg-white p-10 text-center"><Tag className="mx-auto text-gray-300" size={30}/><p className="mt-3 text-sm font-bold">Belum ada campaign Flash Sale</p><p className="mt-1 text-xs text-gray-400">Gunakan salah satu materi frontend di atas atau buat campaign baru.</p></div>}</section>

    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="max-h-[92dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex justify-between"><div><strong>{editing ? "Edit" : "Buat"} Campaign Flash Sale</strong><p className="mt-1 text-xs text-gray-500">Produk reguler tetap aman; hanya harga dan stok promo yang diatur.</p></div><button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100"><X size={17}/></button></div><label className="block text-xs font-semibold text-gray-600">Produk untuk Flash Sale<select required value={form.product_id} onChange={(event) => { const product = products?.find((item) => item.id === event.target.value); setForm({ ...form, product_id: event.target.value, original_price: product?.price || form.original_price }); }} className="mt-1.5 w-full rounded-xl border p-3 text-sm"><option value="">Pilih produk reguler</option>{products?.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-gray-600">Harga normal<input required type="number" min="1" value={form.original_price} onChange={(event) => setForm({ ...form, original_price: event.target.value })} className="mt-1.5 w-full rounded-xl border p-3 text-sm"/></label><label className="text-xs font-semibold text-gray-600">Harga Flash Sale<input required type="number" min="1" value={form.sale_price} onChange={(event) => setForm({ ...form, sale_price: event.target.value })} className="mt-1.5 w-full rounded-xl border p-3 text-sm"/></label></div><label className="block text-xs font-semibold text-gray-600">Stok khusus Flash Sale<input required type="number" min="1" value={form.flash_stock} onChange={(event) => setForm({ ...form, flash_stock: event.target.value })} className="mt-1.5 w-full rounded-xl border p-3 text-sm"/></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold text-gray-600">Mulai<input required type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} className="mt-1.5 w-full rounded-xl border p-2.5 text-xs"/></label><label className="text-xs font-semibold text-gray-600">Selesai<input required type="datetime-local" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} className="mt-1.5 w-full rounded-xl border p-2.5 text-xs"/></label></div><label className="flex items-center justify-between rounded-xl border p-3 text-xs"><span><strong className="block">Campaign aktif</strong><span className="text-gray-400">Izinkan tampil sesuai jadwal.</span></span><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="h-4 w-4 accent-orange-500"/></label><button disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin"/>}Simpan Campaign</button></form></div>}
  </div>;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Download, Eye, Heart, ImageOff, Loader2, Package, Search, TrendingUp, UserRound, Users, X } from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { FRONTEND_CATALOG } from "../../data/frontendCatalog.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { downloadCsv } from "../../utils/downloadCsv.js";

const dateTime = (value) => value ? new Date(value).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Tanggal tidak tersedia";
const keyOf = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fallbackByKey = new Map(FRONTEND_CATALOG.flatMap((item) => [[keyOf(item.slug), item], [keyOf(item.name), item]]));
const productData = (row) => {
  const product = row.products || {};
  const fallback = fallbackByKey.get(keyOf(product.slug)) || fallbackByKey.get(keyOf(product.name)) || {};
  return { ...fallback, ...product, image_url: product.image_url || product.image || product.gambar || fallback.image_url || "" };
};

export default function WishlistIndex() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    const { data, error: requestError } = await supabase.from("wishlist").select("id,user_id,product_id,created_at,profiles(*),products(*)").order("created_at", { ascending: false });
    if (requestError) setError(requestError.message);
    else { setRows(data || []); setError(""); window.dispatchEvent(new CustomEvent("admin:data-success", { detail: { table: "wishlist" } })); }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase.channel(`admin-wishlist-${Date.now()}`).on("postgres_changes", { event: "*", schema: "public", table: "wishlist" }, load).subscribe((status) => setConnected(status === "SUBSCRIBED"));
    return () => supabase.removeChannel(channel);
  }, [load]);

  const visible = useMemo(() => rows.filter((row) => {
    const product = productData(row); const profile = row.profiles || {};
    const matchesSearch = `${product.name || ""} ${profile.full_name || ""} ${profile.phone || ""}`.toLowerCase().includes(query.trim().toLowerCase());
    const created = row.created_at ? new Date(row.created_at) : null; const now = new Date();
    const matchesPeriod = period === "all" || (created && (period === "today" ? created.toDateString() === now.toDateString() : created >= new Date(now.getTime() - Number(period) * 86400000)));
    return matchesSearch && matchesPeriod;
  }), [rows, query, period]);
  const uniqueCustomers = new Set(rows.map((row) => row.user_id).filter(Boolean)).size;
  const uniqueProducts = new Set(rows.map((row) => row.product_id).filter(Boolean)).size;
  const todayCount = rows.filter((row) => row.created_at && new Date(row.created_at).toDateString() === new Date().toDateString()).length;
  const popularity = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => { const product = productData(row); const key = row.product_id || product.name; const current = map.get(key) || { product, count: 0 }; current.count += 1; map.set(key, current); });
    return [...map.values()].sort((a,b)=>b.count-a.count);
  }, [rows]);
  const mostPopular = popularity[0];
  const selectedProduct = selected ? productData(selected) : null;

  const exportCsv = () => {
    const data = [["Produk","Pelanggan","Telepon","Harga","Stok","Ditambahkan"], ...visible.map((row)=>{const product=productData(row),profile=row.profiles||{};return [product.name||"Produk dihapus",profile.full_name||"Pelanggan",profile.phone||"",product.price||0,product.stock??"",row.created_at||""];})];
    downloadCsv(data, "wishlist-pelanggan");
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="flex items-center gap-2 text-xl font-bold text-gray-900"><Heart className="text-primary" fill="currentColor"/>Wishlist Pelanggan</h1><p className="mt-1 text-sm text-gray-500">Analisis produk favorit dan minat pelanggan secara realtime.</p></div><div className="flex items-center gap-2"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-bold ${connected?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600"}`}><span className={`h-2 w-2 rounded-full ${connected?"animate-pulse bg-emerald-500":"bg-amber-500"}`}/>{connected?"REALTIME AKTIF":"MENGHUBUNGKAN"}</span><button onClick={exportCsv} disabled={!visible.length} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gray-900 px-3 text-xs font-bold text-white disabled:opacity-40"><Download size={14}/>Ekspor</button></div></div>
    {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Total Wishlist",rows.length,Heart,"bg-red-50 text-red-500"],["Pelanggan Tertarik",uniqueCustomers,Users,"bg-blue-50 text-blue-600"],["Produk Favorit",uniqueProducts,Package,"bg-orange-50 text-primary"],["Ditambahkan Hari Ini",todayCount,CalendarDays,"bg-emerald-50 text-emerald-600"]].map(([label,value,Icon,color])=><div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><span className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}><Icon size={17}/></span><strong className="mt-3 block text-xl">{value.toLocaleString("id-ID")}</strong><p className="text-[10px] text-gray-500">{label}</p></div>)}</div>
    {mostPopular&&<section className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white p-4 shadow-sm"><div className="flex items-center gap-4"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">{mostPopular.product.image_url?<img src={mostPopular.product.image_url} alt={mostPopular.product.name} className="h-full w-full object-cover"/>:<span className="grid h-full place-items-center text-gray-300"><ImageOff size={22}/></span>}</div><div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-primary"><TrendingUp size={12}/>Produk Paling Diminati</p><h2 className="mt-1 truncate text-sm font-bold text-gray-900">{mostPopular.product.name||"Produk"}</h2><p className="mt-1 text-xs text-gray-500"><strong className="text-primary">{mostPopular.count} pelanggan</strong> menyimpan produk ini · {formatCurrency(mostPopular.product.price)}</p></div><span className="hidden rounded-full bg-primary px-3 py-2 text-[10px] font-bold text-white sm:block">TOP WISHLIST</span></div></section>}
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl bg-gray-50 px-3"><Search size={16} className="text-gray-400"/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Cari produk, pelanggan, atau telepon..." className="w-full bg-transparent text-sm outline-none"/></label><select value={period} onChange={(event)=>setPeriod(event.target.value)} className="min-h-11 rounded-xl border border-gray-200 px-3 text-xs font-semibold"><option value="all">Semua periode</option><option value="today">Hari ini</option><option value="7">7 hari terakhir</option><option value="30">30 hari terakhir</option></select></div>
    {loading?<div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-primary"/></div>:visible.length?<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{visible.map((row)=>{const product=productData(row),profile=row.profiles||{};return <article key={row.id} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="relative aspect-[4/3] overflow-hidden bg-gray-100">{product.image_url?<img src={product.image_url} alt={product.name||"Produk wishlist"} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/>:<span className="grid h-full place-items-center text-gray-300"><ImageOff size={30}/></span>}<span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[9px] font-bold text-white shadow"><Heart size={10} fill="currentColor"/>FAVORIT</span><span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold text-white ${product.is_active!==false?"bg-emerald-500":"bg-gray-600"}`}>{product.is_active!==false?"AKTIF":"NONAKTIF"}</span></div><div className="p-4"><div className="flex items-start justify-between gap-3"><h2 className="line-clamp-2 text-sm font-bold text-gray-900">{product.name||"Produk telah dihapus"}</h2><strong className="shrink-0 text-xs text-primary">{formatCurrency(product.price)}</strong></div><div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 p-2.5"><div className="grid h-9 w-9 shrink-0 overflow-hidden rounded-full bg-orange-100 text-[10px] font-bold text-primary">{profile.avatar_url?<img src={profile.avatar_url} alt={profile.full_name||"Pelanggan"} className="h-full w-full object-cover"/>:<span className="grid h-full place-items-center">{String(profile.full_name||"P").charAt(0).toUpperCase()}</span>}</div><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-gray-700">{profile.full_name||"Pelanggan"}</p><p className="truncate text-[9px] text-gray-400">{profile.phone||"Telepon belum tersedia"}</p></div></div><div className="mt-3 flex items-center justify-between text-[9px] text-gray-400"><span className="flex items-center gap-1"><CalendarDays size={11}/>{dateTime(row.created_at)}</span><span className={`font-bold ${Number(product.stock||0)>0?"text-emerald-600":"text-red-500"}`}>Stok {Number(product.stock||0).toLocaleString("id-ID")}</span></div><button onClick={()=>setSelected(row)} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 text-[10px] font-bold text-blue-600"><Eye size={13}/>Lihat Detail Wishlist</button></div></article>})}</div>:<div className="rounded-2xl border border-dashed bg-white p-12 text-center"><Heart className="mx-auto text-gray-300" size={36}/><h2 className="mt-3 text-sm font-bold">Wishlist tidak ditemukan</h2><p className="mt-1 text-xs text-gray-400">Belum ada wishlist atau ubah filter pencarian.</p></div>}
    {selected&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3"><section className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="relative aspect-[16/8] overflow-hidden bg-gray-100">{selectedProduct.image_url?<img src={selectedProduct.image_url} alt={selectedProduct.name} className="h-full w-full object-cover"/>:<span className="grid h-full place-items-center text-gray-300"><ImageOff size={36}/></span>}<div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/><button onClick={()=>setSelected(null)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur"><X size={17}/></button><div className="absolute inset-x-0 bottom-0 p-5 text-white"><p className="text-[9px] font-bold uppercase tracking-wider text-white/70">Detail Produk Favorit</p><h2 className="mt-1 text-lg font-bold">{selectedProduct.name||"Produk"}</h2></div></div><div className="space-y-4 p-5"><div className="grid grid-cols-3 gap-2"><div className="col-span-2 rounded-xl bg-orange-50 p-3"><p className="text-[9px] text-orange-500">Harga produk</p><strong className="mt-1 block text-sm text-primary">{formatCurrency(selectedProduct.price)}</strong></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-[9px] text-gray-400">Stok</p><strong className="mt-1 block text-sm">{Number(selectedProduct.stock||0).toLocaleString("id-ID")}</strong></div></div><p className="text-[11px] leading-5 text-gray-500">{selectedProduct.description||"Belum ada deskripsi produk."}</p><div className="rounded-2xl border border-gray-100 p-4"><p className="flex items-center gap-2 text-xs font-bold"><UserRound size={14} className="text-primary"/>Informasi Pelanggan</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-gray-50 p-3"><p className="text-[9px] text-gray-400">Nama</p><strong className="mt-1 block truncate text-[11px]">{selected.profiles?.full_name||"Pelanggan"}</strong></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-[9px] text-gray-400">Nomor telepon</p><strong className="mt-1 block truncate text-[11px]">{selected.profiles?.phone||"Belum tersedia"}</strong></div></div></div><div className="rounded-xl bg-red-50 p-3 text-[10px] text-red-600"><CheckCircle2 size={13} className="mb-1"/>Ditambahkan ke wishlist pada <strong>{dateTime(selected.created_at)}</strong>.</div><p className="break-all rounded-xl bg-gray-50 p-3 font-mono text-[9px] text-gray-400">Wishlist ID: {selected.id}</p></div></section></div>}
  </div>;
}

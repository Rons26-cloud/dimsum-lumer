import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChefHat, Heart, Loader2, Minus, PackageCheck, Plus, Scale, ShieldCheck, Snowflake, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase/client.js";
import { useWishlist } from "../hooks/useWishlist.js";
import { useLiveCollection } from "../hooks/useLiveCollection.js";
import { useAuth } from "../hooks/useAuth.js";
import { getFreshLocation } from "../hooks/useLiveGeolocation.js";
import { TABLES } from "../supabase/constants.js";
import ProductCard from "../components/cards/ProductCard.jsx";
import { mergeProductCatalog, resolveProductImage } from "../features/products/productAssets.js";
import { upsertCartItem } from "../services/cartService.js";
import { useStoreStatus } from "../hooks/useStoreStatus.js";
import { runtimeId } from "../utils/runtimeId.js";

function productInfo(product) {
  const name = (product?.name || "").toLowerCase();
  if (name.includes("udang")) return { ingredients: "Udang Segar", weight: "±140gr / Box" };
  if (name.includes("moza") || name.includes("mentai") || name.includes("keju")) return { ingredients: "Ayam, Mozarella", weight: "±150gr / Box" };
  return { ingredients: "Ayam Premium", weight: "±150gr / Box" };
}

function WhatsAppIcon({ size=17 }) {
  return <svg aria-hidden="true" viewBox="0 0 32 32" width={size} height={size} fill="currentColor"><path d="M16.04 3A12.77 12.77 0 0 0 5.1 22.36L3 29l6.84-2.02A12.8 12.8 0 1 0 16.04 3Zm0 2.16a10.62 10.62 0 0 1 0 21.24c-1.82 0-3.6-.47-5.16-1.35l-.74-.42-3.94 1.16 1.2-3.82-.48-.77A10.62 10.62 0 0 1 16.04 5.16Zm-5.13 5.18c-.25 0-.66.1-1 .48-.35.38-1.33 1.3-1.33 3.16 0 1.87 1.36 3.67 1.55 3.92.19.25 2.67 4.08 6.48 5.72.9.39 1.61.62 2.16.8.91.28 1.73.24 2.38.15.73-.11 2.23-.91 2.55-1.8.32-.88.32-1.64.22-1.8-.09-.16-.35-.25-.73-.44-.38-.19-2.23-1.1-2.58-1.23-.34-.13-.6-.19-.85.19-.25.38-.98 1.23-1.2 1.48-.22.25-.44.28-.82.09-.38-.19-1.6-.59-3.05-1.88a11.44 11.44 0 0 1-2.11-2.63c-.22-.38-.02-.59.17-.78.17-.17.38-.44.57-.66.19-.22.25-.38.38-.63.13-.25.06-.47-.03-.66-.1-.19-.85-2.05-1.17-2.81-.3-.74-.62-.64-.85-.65h-.73Z"/></svg>;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const store = useStoreStatus();
  const wishlist = useWishlist();
  const catalogData = useLiveCollection(TABLES.PRODUCTS, { filters: { is_active: true }, order: { column: "name" } });
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState("ready");
  const [message, setMessage] = useState("");
  const [waLoading, setWaLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    setQty(1); setVariant("ready"); setMessage(""); setLoading(true);
  }, [slug]);

  useEffect(() => {
    let active = true;
    (async () => {
      const availableCatalog = mergeProductCatalog(catalogData);
      const catalogProduct = availableCatalog.find((item) => item.id === slug || item.slug === slug);
      if (catalogProduct) { if (active) { setProduct(catalogProduct); setLoading(false); } return; }
      if (/^[0-9a-f-]{36}$/i.test(slug || "")) {
        const { data } = await supabase.from("products").select("*").eq("id", slug).maybeSingle();
        if (data) { if (active) { setProduct(data); setLoading(false); } return; }
      }
      if (!Array.isArray(catalogData)) return;
      if (active) { setProduct(null); setLoading(false); }
    })();
    return () => { active = false; };
  }, [slug, catalogData]);

  useEffect(() => {
    const productId = product?.id;
    if (!productId || !/^[0-9a-f-]{36}$/i.test(productId)) return undefined;

    const refreshProduct = async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
      if (error) {
        console.error("Gagal menyinkronkan detail produk:", error.message);
        return;
      }
      if (!data || data.is_active === false) {
        setProduct(null);
        return;
      }
      setProduct((current) => ({ ...current, ...data }));
      setQty((current) => Math.max(1, Math.min(current, Number(data.stock || 1))));
    };

    const channel = supabase
      .channel(`product-detail-${productId}-${runtimeId()}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products", filter: `id=eq.${productId}` }, ({ new: next }) => {
        if (next.is_active === false) { setProduct(null); return; }
        setProduct((current) => ({ ...current, ...next }));
        setQty((current) => Math.max(1, Math.min(current, Number(next.stock || 1))));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "products", filter: `id=eq.${productId}` }, () => setProduct(null))
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refreshProduct();
      });

    const onVisible = () => { if (document.visibilityState === "visible") refreshProduct(); };
    window.addEventListener("focus", refreshProduct);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refreshProduct);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [product?.id]);

  const catalog = mergeProductCatalog(catalogData);
  const related = useMemo(() => catalog.filter((item) => item.id !== product?.id).slice(0, 10), [catalog, product?.id]);
  const relatedRef=useRef(null);
  useEffect(()=>{if(related.length<2)return undefined;const timer=window.setInterval(()=>{const node=relatedRef.current;if(!node)return;const atEnd=node.scrollLeft+node.clientWidth>=node.scrollWidth-8;node.scrollTo({left:atEnd?0:node.scrollLeft+Math.max(150,node.clientWidth*.55),behavior:'smooth'});},3600);return()=>window.clearInterval(timer);},[related.length,slug]);

  if (loading) return <div className="grid min-h-dvh place-items-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!product) return <div className="mx-auto max-w-md p-8 text-center"><button onClick={() => navigate(-1)} className="fixed left-3 top-3 z-50 bg-transparent"><ArrowLeft size={20}/></button><p className="text-sm text-gray-500">Produk tidak ditemukan.</p></div>;

  const info = productInfo(product);
  const readyPrice = Number(product.price || 0);
  const frozenPrice = Number(product.frozen_price || 55000);
  const selected = variant === "frozen" ? { id: "frozen", label: "Frozen Beku, Siap Masak", price: frozenPrice, unit: "20 Pcs" } : { id: "ready", label: "Goreng Siap Makan", price: readyPrice, unit: "Box" };
  const total = selected.price * qty;
  const image = resolveProductImage(product);
  const cartProduct = { ...product, product_id: product.id, price: selected.price, variant: selected.label, variant_id: selected.id };

  const addItem = async () => {
    if (!store.isOpen) { setMessage("Toko sedang tutup. Produk belum dapat ditambahkan ke keranjang."); return; }
    if (!user) { navigate("/login", { state: { from: `/produk/${slug}` } }); return; }
    setMessage('');
    try { await upsertCartItem({userId:user.id,product:cartProduct,quantity:qty,variant:selected.label,unitPrice:selected.price});window.dispatchEvent(new Event('cart:refresh'));navigate("/keranjang"); }
    catch(error){setMessage(error.message||'Produk gagal dimasukkan ke keranjang.');}
  };
  const toggleFavorite = async () => {
    if (!user) { navigate("/login", { state: { from: `/produk/${slug}` } }); return; }
    const result = await wishlist.toggleWishlist(product.id);
    if (result.requiresLogin) navigate("/login");
  };
  const whatsapp = async () => {
    if (!user) { navigate(`/pesan-whatsapp?product=${encodeURIComponent(product.slug || product.id)}&variant=${encodeURIComponent(selected.label)}&price=${selected.price}&qty=${qty}`, { state: { product, variant: selected, qty } }); return; }
    const number = (import.meta.env.VITE_ADMIN_WA_NUMBER || "").replace(/\D/g, "");
    if (!number) { setMessage("Nomor WhatsApp toko belum dikonfigurasi."); return; }
    setMessage(""); setWaLoading(true);
    try {
      const location = await getFreshLocation();
      const text = `Halo Dimsum Lumer, saya ingin pesan:\n${product.name}\nJenis: ${selected.label}\nJumlah: ${qty}\nTotal: Rp${total.toLocaleString("id-ID")}\nLokasi realtime: https://www.google.com/maps?q=${location.lat},${location.lng}\nAkurasi GPS: ${Math.round(location.accuracy)} meter`;
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    } catch (error) { setMessage(error.message || "Lokasi realtime wajib diaktifkan untuk memesan lewat WhatsApp."); }
    finally { setWaLoading(false); }
  };

  return <div className="mx-auto min-h-dvh max-w-4xl bg-white pb-8 text-slate-900 sm:my-5 sm:overflow-hidden sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-sm">
    <button type="button" onClick={() => navigate(-1)} className="fixed left-3 top-[calc(.75rem+env(safe-area-inset-top))] z-50 grid h-9 w-9 place-items-center border-0 bg-transparent p-0 text-gray-900 shadow-none active:text-primary" aria-label="Kembali"><ArrowLeft size={20}/></button>
    <div className="relative aspect-[4/3] max-h-[500px] overflow-hidden bg-slate-100 sm:aspect-[16/9]"><img src={image} alt={product.name} className="h-full w-full object-cover"/><button onClick={toggleFavorite} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-sm backdrop-blur" aria-label="Tambah ke favorit"><Heart size={18} className="text-primary" fill={wishlist.isWishlisted(product.id) ? "currentColor" : "none"}/></button></div>
    <main className="space-y-6 p-4 sm:p-7">
      <section><p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Dimsum pilihan</p><h1 className="text-xl font-extrabold leading-tight text-slate-900 sm:text-2xl">{product.name}</h1><strong className="mt-2 block text-xl text-primary">Rp{readyPrice.toLocaleString("id-ID")} <small className="text-xs font-medium text-slate-400">/ box</small></strong><div className="mt-2 flex items-center gap-1.5"><span className="flex text-amber-400">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill="currentColor" strokeWidth={0}/>)}</span><strong className="text-xs">{product.rating || 4.9}</strong><span className="text-xs text-slate-400">({Number(product.review_count || 1280).toLocaleString("id-ID")} ulasan)</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{product.description || "Dimsum segar dari bahan pilihan, dibuat khusus untuk pesananmu."}</p></section>
      <section className="grid grid-cols-2 gap-2"><div className="flex gap-2 rounded-2xl bg-gray-50 p-3"><ChefHat size={17} className="shrink-0 text-primary"/><div><span className="text-[9px] text-gray-400">Isi:</span><strong className="block text-[10px]">{info.ingredients}</strong></div></div><div className="flex gap-2 rounded-2xl bg-gray-50 p-3"><Scale size={17} className="shrink-0 text-primary"/><div><span className="text-[9px] text-gray-400">Berat:</span><strong className="block text-[10px]">{info.weight}</strong></div></div><div className="flex items-center gap-2 rounded-2xl bg-gray-50 p-3"><ShieldCheck size={17} className="text-emerald-600"/><strong className="text-[10px]">Tanpa Pengawet</strong></div><div className="flex items-center gap-2 rounded-2xl bg-gray-50 p-3"><Snowflake size={17} className="text-blue-500"/><strong className="text-[10px]">Simpan di Freezer</strong></div></section>
      <section><h2 className="mb-2 text-xs font-extrabold">Pilih Jenis</h2><div className="space-y-2">{[{ id: "ready", label: "Goreng Siap Makan", price: readyPrice, unit: "Box", Icon: PackageCheck }, { id: "frozen", label: "Frozen Beku, Siap Masak", price: frozenPrice, unit: "20 Pcs", Icon: Snowflake }].map((option) => <button key={option.id} onClick={() => setVariant(option.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${variant === option.id ? "border-primary bg-primary-50" : "border-gray-100 bg-white"}`}><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary"><option.Icon size={19}/></span><span className="min-w-0 flex-1"><strong className="block text-[11px]">{option.label}</strong><span className="text-[9px] text-gray-500">Rp{option.price.toLocaleString("id-ID")} / {option.unit}</span></span>{variant === option.id && <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-white"><Check size={12}/></span>}</button>)}</div></section>
      <section className="flex items-center justify-between rounded-2xl bg-gray-50 p-3"><div><span className="text-[9px] text-gray-400">Jumlah</span><div className="mt-1 flex items-center gap-2"><button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm"><Minus size={13}/></button><strong className="w-6 text-center text-xs">{qty}</strong><button onClick={() => setQty(Math.min(Number(product.stock || 99), qty + 1))} className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm"><Plus size={13}/></button></div></div><div className="text-right"><span className="text-[9px] text-gray-400">Total Harga</span><strong className="mt-1 block text-base text-primary">Rp{total.toLocaleString("id-ID")}</strong></div></section>
      {message && <p className="rounded-xl bg-red-50 p-3 text-[10px] text-red-600">{message}</p>}
      {!user?<section className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><div><strong className="text-sm text-emerald-900">Pesan tanpa akun</strong><p className="mt-1 text-xs leading-5 text-emerald-700">Isi data penerima, pilih Tunai, Transfer, atau QRIS, lalu kirim pesanan melalui WhatsApp.</p></div><button onClick={whatsapp} disabled={waLoading||!store.isOpen} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold text-white shadow-sm transition hover:bg-[#20bd5a] disabled:bg-slate-300"><WhatsAppIcon/>{waLoading?'Mengambil lokasi...':'Pesan langsung via WhatsApp'}</button><button onClick={()=>navigate('/login',{state:{from:`/produk/${slug}`}})} className="h-11 w-full rounded-xl border border-primary bg-white text-xs font-bold text-primary">Masuk untuk keranjang & riwayat pesanan</button></section>:<section className="grid grid-cols-[1fr_auto] gap-2.5"><button onClick={whatsapp} disabled={waLoading || !store.isOpen} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold text-white shadow-sm transition hover:bg-[#20bd5a] disabled:bg-slate-300"><WhatsAppIcon/>{waLoading ? "Mengambil lokasi..." : "Pesan via WhatsApp"}</button><button onClick={toggleFavorite} className="grid h-12 w-12 place-items-center rounded-xl border border-primary text-primary" aria-label="Tambah ke Favorit"><Heart size={18} fill={wishlist.isWishlisted(product.id) ? "currentColor" : "none"}/></button><button onClick={addItem} disabled={!store.isOpen || product.is_active === false || product.stock === 0} className="col-span-2 h-12 rounded-xl bg-primary text-sm font-bold text-white disabled:bg-slate-300">{store.isOpen ? "Tambah ke keranjang" : "Toko sedang tutup"}</button></section>}
      {related.length > 0 && <section className="border-t border-slate-100 pt-6"><h2 className="text-base font-extrabold text-slate-900">Mungkin kamu juga suka</h2><p className="mb-4 mt-1 text-xs text-slate-500">Pilihan lain untuk melengkapi pesananmu</p><div ref={relatedRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{related.map((item) => <div key={item.id} className="w-[44%] min-w-[145px] max-w-[190px] shrink-0 snap-start sm:w-[28%]"><ProductCard product={item}/></div>)}</div><p className="mt-2 text-center text-[10px] font-medium uppercase tracking-widest text-slate-400">Bergerak otomatis · bisa digeser</p></section>}
    </main>
  </div>;
}

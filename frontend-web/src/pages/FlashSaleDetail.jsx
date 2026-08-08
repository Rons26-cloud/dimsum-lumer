import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Loader2, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useFlashSales } from "../features/flash-sale/useFlashSales.js";
import { resolveFlashSaleImage as resolveProductImage } from "../features/flash-sale/flashSaleAssets.js";
import { useAuth } from "../hooks/useAuth.js";
import { upsertCartItem } from "../services/cartService.js";

export default function FlashSaleDetail() {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const sales = useFlashSales();
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [, tick] = useState(0);
  const sale = useMemo(() => sales.find((item) => item.id === saleId), [sales, saleId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = window.setInterval(() => tick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [saleId]);

  if (!sale) return <div className="grid min-h-dvh place-items-center"><Loader2 className="animate-spin text-primary" /></div>;

  const product = sale.products;
  const remaining = Math.max(0, new Date(sale.ends_at).getTime() - Date.now());
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor(remaining / 60000) % 60;
  const seconds = Math.floor(remaining / 1000) % 60;
  const discount = Math.round((1 - Number(sale.sale_price) / Number(sale.original_price)) * 100);
  const total = Number(sale.sale_price) * qty;

  const add = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setSaving(true);
    setError("");
    try {
      await upsertCartItem({
        userId: user.id,
        product,
        quantity: qty,
        variant: "Flash Sale",
        flashSaleId: sale.id,
        unitPrice: Number(sale.sale_price),
      });
      window.dispatchEvent(new Event('cart:refresh'));
      navigate("/keranjang");
    } catch (reason) {
      setError(reason.message || "Produk gagal dimasukkan ke keranjang.");
    } finally {
      setSaving(false);
    }
  };

  return <main className="mx-auto min-h-dvh max-w-xl bg-white pb-6">
    <div className="relative aspect-square max-h-[520px] overflow-hidden bg-gray-100">
      <img src={resolveProductImage(product)} alt={product.name} className="h-full w-full object-cover" />
      <button onClick={() => navigate(-1)} className="absolute left-3 top-[calc(.75rem+env(safe-area-inset-top))] z-10 grid h-9 w-9 place-items-center bg-transparent text-dark active:text-primary" aria-label="Kembali"><ArrowLeft size={20} /></button>
      <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[9px] font-bold text-white"><Zap size={11} />Diskon {discount}%</span>
    </div>
    <div className="space-y-4 p-3">
      <section><h1 className="text-base font-extrabold">{product.name}</h1><div className="mt-1 flex items-center gap-2"><strong className="text-base text-primary">Rp{Number(sale.sale_price).toLocaleString("id-ID")}</strong><span className="text-[10px] text-gray-400 line-through">Rp{Number(sale.original_price).toLocaleString("id-ID")}</span></div><p className="mt-2 text-[10px] leading-5 text-gray-500">{product.description}</p></section>
      <div className="flex items-center justify-between rounded-2xl bg-primary-50 p-3"><span className="flex items-center gap-1 text-[10px] font-bold text-primary"><Clock size={13} />Berakhir dalam</span><strong className="text-xs text-primary">{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong></div>
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 p-3"><div><span className="text-[9px] text-gray-500">Jumlah</span><div className="mt-1 flex items-center gap-2"><button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-8 w-8 place-items-center rounded-lg bg-gray-50"><Minus size={13} /></button><strong className="text-xs">{qty}</strong><button onClick={() => setQty(Math.min(Number(sale.flash_stock), qty + 1))} className="grid h-8 w-8 place-items-center rounded-lg bg-gray-50"><Plus size={13} /></button></div></div><div className="text-right"><span className="text-[9px] text-gray-500">Total</span><strong className="block text-sm text-primary">Rp{total.toLocaleString("id-ID")}</strong></div></div>
      <p className="rounded-xl bg-amber-50 p-3 text-[9px] leading-4 text-amber-700">Produk Flash Sale wajib dibeli dengan akun Login dan tidak mendapatkan koin member.</p>
      {error && <p className="rounded-xl bg-red-50 p-3 text-[10px] text-red-600">{error}</p>}
      <button onClick={add} disabled={saving || !remaining || qty > Number(sale.flash_stock)} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white disabled:bg-gray-300">{saving ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}Tambah Flash Sale ke Keranjang</button>
    </div>
  </main>;
}

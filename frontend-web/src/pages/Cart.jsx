import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useCart } from "../hooks/useCart.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import ProductCard from "../components/cards/ProductCard.jsx";
import {
  mergeProductCatalog,
  resolveProductImage,
} from "../features/products/productAssets.js";
import { useAuth } from "../hooks/useAuth.js";
import { useLiveCollection } from "../hooks/useLiveCollection.js";
import { resolveServerProduct } from "../services/cartService.js";
import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";
import { isOutOfStock, maxPurchasable } from "../utils/productStock.js";

const money = (value) => `Rp${Number(value || 0).toLocaleString("id-ID")}`;

export default function Cart() {
  const { items, removeItem, updateQty } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const catalogData = useLiveCollection(TABLES.PRODUCTS, {
    order: { column: "sold_count", ascending: false },
  });
  const sliderRef = useRef(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0,
  );
  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );
  const recommendations = useMemo(() => {
    const ids = new Set(
      items.flatMap((item) => [item.id, item.product_id]).filter(Boolean),
    );
    const names = new Set(
      items.map((item) => String(item.name || "").toLowerCase()),
    );
    return mergeProductCatalog(catalogData)
      .filter(
        (product) =>
          !ids.has(product.id) &&
          !names.has(String(product.name || "").toLowerCase()),
      )
      .slice(0, 10);
  }, [catalogData, items]);

  useEffect(() => {
    if (recommendations.length < 2) return undefined;
    const timer = window.setInterval(() => {
      const node = sliderRef.current;
      if (!node) return;
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 12;
      node.scrollTo({
        left: atEnd
          ? 0
          : node.scrollLeft + Math.max(150, node.clientWidth * 0.48),
        behavior: "smooth",
      });
    }, 3500);
    return () => window.clearInterval(timer);
  }, [recommendations.length]);

  const serverIdentity = async (item) => {
    const product = await resolveServerProduct(item);
    return product?.id || null;
  };
  const changeQuantity = async (item, itemKey, nextQty) => {
    const previous = item.qty;
    updateQty(itemKey, nextQty);
    setSyncError("");
    if (!user) return;
    try {
      const productId = await serverIdentity(item);
      if (!productId) return;
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: nextQty })
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("variant", item.variant || "Original");
      if (error) throw error;
    } catch (error) {
      updateQty(itemKey, previous);
      setSyncError(error.message || "Jumlah produk gagal diperbarui.");
    }
  };
  const remove = async (item, itemKey) => {
    setSyncError("");
    if (user) {
      try {
        const productId = await serverIdentity(item);
        if (productId) {
          let query = supabase
            .from("cart_items")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId);
          if (item.variant) query = query.eq("variant", item.variant);
          const { error } = await query;
          if (error) throw error;
        }
      } catch (error) {
        setSyncError(error.message || "Produk gagal dihapus.");
        return;
      }
    }
    removeItem(itemKey);
  };
  const checkout = async () => {
    if (!user) {
      navigate("/login", { state: { from: "/keranjang" } });
      return;
    }
    if (!items.length) return;
    setSyncing(true);
    setSyncError("");
    try {
      const { data: allProducts, error: productError } = await supabase
        .from("products")
        .select("id,name,stock,is_active");
      if (productError) throw productError;
      const serverProducts = (allProducts || []).filter(
        (product) => product.is_active !== false,
      );
      const normalize = (value) =>
        String(value || "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
      const resolvedItems = items.map((item) => {
        const requestedId = item.product_id || item.id;
        const itemName = normalize(item.name);
        const match =
          serverProducts.find((product) => product.id === requestedId) ||
          serverProducts.find(
            (product) => normalize(product.name) === itemName,
          ) ||
          serverProducts.find(
            (product) =>
              normalize(product.name).includes(itemName) ||
              itemName.includes(normalize(product.name)),
          );
        return { ...item, resolvedProductId: match?.id || null };
      });
      const missing = resolvedItems.filter((item) => !item.resolvedProductId);
      if (missing.length)
        throw new Error(
          `Produk belum tersedia di Supabase: ${missing.map((item) => item.name).join(", ")}.`,
        );
      const unavailable = resolvedItems.filter((item) => {
        const product = serverProducts.find(
          (entry) => entry.id === item.resolvedProductId,
        );
        return (
          isOutOfStock(product) || Number(item.qty) > maxPurchasable(product)
        );
      });
      if (unavailable.length)
        throw new Error(
          `Stok berubah. Periksa kembali: ${unavailable.map((item) => item.name).join(", ")}.`,
        );
      const payload = resolvedItems.map((item) => ({
        user_id: user.id,
        product_id: item.resolvedProductId,
        quantity: Number(item.qty || 1),
        variant: item.variant || "Original",
        flash_sale_id: item.flash_sale_id || null,
        unit_price: Number(item.price || 0),
        is_flash_sale: Boolean(item.is_flash_sale),
      }));
      let { error } = await supabase
        .from("cart_items")
        .upsert(payload, { onConflict: "user_id,product_id,variant" });
      if (
        error &&
        /flash_sale_id|unit_price|is_flash_sale|schema cache/i.test(
          error.message || "",
        )
      ) {
        ({ error } = await supabase.from("cart_items").upsert(
          payload.map(({ user_id, product_id, quantity, variant }) => ({
            user_id,
            product_id,
            quantity,
            variant,
          })),
          { onConflict: "user_id,product_id,variant" },
        ));
      }
      if (error) throw error;
      navigate("/checkout");
    } catch (error) {
      setSyncError(error.message || "Keranjang gagal disinkronkan.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-gradient-to-b from-gray-50 to-white pb-44 pt-[calc(3.75rem+env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="fixed left-3 top-[calc(.75rem+env(safe-area-inset-top))] z-40 grid h-9 w-9 place-items-center rounded-full bg-white/70 text-gray-900 backdrop-blur active:text-primary"
        aria-label="Kembali"
      >
        <ArrowLeft size={20} />
      </button>
      <main className="space-y-6 px-3 xs:px-4">
        {location.state?.message && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-[10px] font-semibold text-emerald-700">
            {location.state.message}
          </div>
        )}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h1 className="text-lg font-extrabold text-gray-950">
                Keranjang Saya
              </h1>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {totalItems} item siap dipesan
              </p>
            </div>
            {items.length > 0 && (
              <span className="rounded-full border border-gray-100 px-2.5 py-1 text-[9px] font-semibold text-gray-500">
                Tersimpan otomatis
              </span>
            )}
          </div>
          {!items.length ? (
            <div className="rounded-3xl border border-gray-100 bg-white">
              <EmptyState
                icon={ShoppingBag}
                title="Keranjang kosong"
                description="Pilih produk untuk mulai melakukan pemesanan."
              />
              <button
                type="button"
                onClick={() => navigate("/produk")}
                className="mx-auto mb-6 flex h-10 items-center gap-1 rounded-xl bg-primary px-5 text-[10px] font-bold text-white"
              >
                Lihat Menu
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => {
                const itemKey = item.cart_key || item.id;
                return (
                  <article
                    key={itemKey}
                    className="rounded-3xl border border-gray-100 bg-white p-2.5 shadow-sm"
                  >
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/produk/${item.slug || item.product_id || item.id}`,
                          )
                        }
                        className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl bg-gray-100"
                      >
                        <img
                          src={resolveProductImage(item)}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/produk/${item.slug || item.product_id || item.id}`,
                              )
                            }
                            className="min-w-0 text-left"
                          >
                            <h2 className="line-clamp-1 text-[12px] font-extrabold text-gray-900">
                              {item.name}
                            </h2>
                            <p className="mt-0.5 line-clamp-1 text-[9px] text-gray-400">
                              {item.variant || "Original"}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(item, itemKey)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-gray-300 active:bg-red-50 active:text-red-500"
                            aria-label={`Hapus ${item.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                          <div>
                            <strong className="block text-xs text-gray-950">
                              {money(item.price)}
                            </strong>
                            <span className="text-[8px] text-gray-400">
                              Subtotal{" "}
                              {money(
                                Number(item.price || 0) * Number(item.qty || 0),
                              )}
                            </span>
                          </div>
                          <div className="flex items-center rounded-xl border border-gray-100 bg-white p-1">
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(
                                  item,
                                  itemKey,
                                  Math.max(1, item.qty - 1),
                                )
                              }
                              disabled={item.qty <= 1}
                              className="grid h-7 w-7 place-items-center rounded-lg text-gray-500 disabled:text-gray-200"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-7 text-center text-[11px] font-bold">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(item, itemKey, item.qty + 1)
                              }
                              disabled={item.qty >= Number(item.stock || 99)}
                              className="grid h-7 w-7 place-items-center rounded-lg text-gray-500 disabled:text-gray-200"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {items.length > 0 && (
          <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-extrabold">Ringkasan Belanja</h2>
            <div className="mt-3 space-y-2 border-b border-dashed border-gray-200 pb-3 text-[10px]">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({totalItems} item)</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Ongkir</span>
                <span>Dihitung saat checkout</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold">Total sementara</span>
              <strong className="text-base text-primary">
                {money(subtotal)}
              </strong>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 text-[9px] leading-4 text-gray-500">
              <ShieldCheck size={17} className="shrink-0 text-emerald-600" />
              <span>
                Pembayaran aman dan pesanan tersimpan langsung di Supabase.
              </span>
            </div>
          </section>
        )}

        {recommendations.length > 0 && (
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-sm font-extrabold">Rekomendasi Pilihan</h2>
                <p className="text-[9px] text-gray-400">
                  Disusun berdasarkan produk yang paling diminati
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/produk")}
                className="flex items-center text-[9px] font-bold text-primary"
              >
                Lihat semua
                <ChevronRight size={13} />
              </button>
            </div>
            <div
              ref={sliderRef}
              className="scrollbar-hide flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-2"
            >
              {recommendations.map((product) => (
                <div
                  key={product.id}
                  className="w-[42%] min-w-[132px] max-w-[160px] shrink-0 snap-start"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-center gap-1">
              {recommendations.slice(0, 5).map((product, index) => (
                <span
                  key={product.id}
                  className={`h-1 rounded-full ${index === 0 ? "w-4 bg-primary" : "w-1 bg-gray-200"}`}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl rounded-t-[1.75rem] border border-b-0 border-gray-100 bg-white/95 px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_35px_rgba(17,24,39,.10)] backdrop-blur-xl sm:px-4">
          <div className="mb-2.5 flex items-center justify-between px-1">
            <div>
              <span className="block text-[9px] font-medium text-gray-400">
                Total sementara · {totalItems} item
              </span>
              <strong className="text-lg font-extrabold text-gray-950">
                {money(subtotal)}
              </strong>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[9px] font-bold text-emerald-700">
              <ShieldCheck size={12} />
              Transaksi aman
            </span>
          </div>
          <button
            type="button"
            onClick={checkout}
            disabled={syncing}
            className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-gradient-to-r from-orange-600 to-primary px-4 text-white shadow-lg shadow-primary/25 transition active:scale-[.99] disabled:opacity-60"
          >
            <span className="flex items-center gap-2 text-xs font-extrabold">
              {syncing ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <PackageCheck size={18} />
              )}{" "}
              {syncing ? "Memeriksa stok…" : "Lanjut Checkout"}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold">
              Pilih pengiriman
              <ChevronRight size={15} />
            </span>
          </button>
          {syncError && (
            <p
              role="alert"
              className="mt-2 rounded-xl border border-red-100 bg-red-50 p-2.5 text-center text-[10px] font-medium text-red-600"
            >
              {syncError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

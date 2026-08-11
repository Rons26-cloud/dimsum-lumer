import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, Search } from "lucide-react";
import { ProductCardView } from "../components/cards/ProductCard.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useWishlist } from "../hooks/useWishlist.js";
import { useRealtime } from "../hooks/useRealtime.js";
import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";

export default function Wishlist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const [products, setProducts] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");
  const load = useCallback(async () => {
    if (!user || wishlist.loading) return;
    if (!wishlist.ids.size) {
      setProducts([]);
      setError("");
      return;
    }
    const { data, error: requestError } = await supabase
      .from(TABLES.PRODUCTS)
      .select("*")
      .in("id", [...wishlist.ids]);
    if (requestError) {
      setProducts([]);
      setError(requestError.message);
    } else {
      setProducts((data || []).filter((item) => item.is_active !== false));
      setError("");
    }
  }, [user, wishlist.ids, wishlist.loading]);
  useEffect(() => {
    load();
  }, [load]);
  useRealtime(TABLES.PRODUCTS, "*", load, null, Boolean(user));
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (products || []).filter(
      (product) =>
        !needle ||
        `${product.name || ""} ${product.description || ""}`
          .toLowerCase()
          .includes(needle),
    );
  }, [products, query]);
  const remove = async (product) => {
    setRemoving(product.id);
    setError("");
    const result = await wishlist.toggleWishlist(product.id);
    setRemoving("");
    if (result.error) setError(result.error);
  };

  if (!user)
    return (
      <div className="mx-auto grid min-h-[65dvh] max-w-md place-items-center px-5 text-center">
        <div>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary">
            <Heart size={24} />
          </span>
          <h1 className="mt-3 text-sm font-bold">
            Masuk untuk melihat favorit
          </h1>
          <p className="mt-1 text-[10px] text-gray-400">
            Simpan menu favorit setelah login.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login", { state: { from: "/wishlist" } })}
            className="mt-4 h-10 rounded-xl bg-primary px-5 text-[10px] font-bold text-white"
          >
            Login / Daftar
          </button>
        </div>
      </div>
    );
  const loading = wishlist.loading || products === null;
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl overscroll-y-contain bg-white px-3 pb-28 xs:px-4">
      <header className="sticky top-0 z-40 -mx-3 mb-3 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-end gap-2 border-b border-slate-200 bg-white px-3 pb-2 pt-[env(safe-area-inset-top)] shadow-sm xs:-mx-4 xs:px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-transparent text-gray-900 transition-colors active:bg-gray-100"
          aria-label="Kembali"
        >
          <ArrowLeft size={19} />
        </button>
        <div className="min-w-0 flex-1 pb-0.5">
          <h1 className="text-sm font-extrabold text-dark">Favorit Saya</h1>
          <p className="text-[9px] text-gray-400">
            Koleksi produk pilihan Anda
          </p>
        </div>
        <span className="flex h-8 min-w-8 items-center justify-center gap-1 rounded-full border border-primary/15 bg-primary-50 px-2 text-[9px] font-extrabold text-primary">
          <Heart size={12} fill="currentColor" />
          {wishlist.ids.size}
        </span>
      </header>
      <label className="relative mb-4 block">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari produk favorit"
          className="h-10 w-full rounded-2xl border border-gray-200 bg-white pl-9 pr-3 text-[10px] shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </label>
      {error && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-red-50 p-3 text-[9px] text-red-600">
          <span>{error}</span>
          <button type="button" onClick={load} className="font-bold">
            Ulangi
          </button>
        </div>
      )}
      {loading ? (
        <div className="grid min-h-52 place-items-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : !products.length ? (
        <section className="rounded-3xl border border-gray-100 bg-white px-5 py-10 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary">
            <Heart size={25} />
          </span>
          <h2 className="mt-3 text-xs font-extrabold">Favorit masih kosong</h2>
          <p className="mt-1 text-[9px] leading-4 text-gray-400">
            Pilih ikon hati untuk menyimpan produk.
          </p>
          <Link
            to="/produk"
            className="mt-4 inline-flex h-9 items-center rounded-xl bg-primary px-4 text-[9px] font-bold text-white"
          >
            Lihat Menu
          </Link>
        </section>
      ) : !visible.length ? (
        <section className="rounded-3xl border border-gray-100 bg-white py-10 text-center shadow-sm">
          <Search className="mx-auto text-gray-300" size={22} />
          <p className="mt-2 text-[9px] text-gray-400">
            Produk tidak ditemukan.
          </p>
        </section>
      ) : (
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-extrabold text-dark">
                Produk Tersimpan
              </h2>
              <p className="mt-0.5 text-[8px] text-gray-400">
                Tersinkron secara otomatis dengan akun Anda
              </p>
            </div>
            <span className="rounded-full bg-gray-50 px-2 py-1 text-[8px] font-semibold text-gray-500">
              {visible.length} produk
            </span>
          </div>
          <div className="grid grid-cols-3 items-stretch gap-1.5 xs:gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => (
              <ProductCardView
                key={product.id}
                product={product}
                wishlisted
                onToggleWishlist={remove}
                busy={removing === product.id}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

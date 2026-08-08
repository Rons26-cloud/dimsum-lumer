import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { useLiveCollection } from "../hooks/useLiveCollection.js";
import { TABLES } from "../supabase/constants.js";
import { ProductGrid } from "../features/products/ProductGrid.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { mergeProductCatalog } from "../features/products/productAssets.js";

export default function Product() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const category = params.get("category") || "";
  const products = useLiveCollection(TABLES.PRODUCTS, { filters: { is_active: true }, order: { column: "name" } });
  const catalog = mergeProductCatalog(products);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return catalog.filter((product) => (!category || product.category_id === category) && (!term || `${product.name} ${product.description || ""}`.toLowerCase().includes(term)));
  }, [catalog, category, query]);

  useEffect(() => { setQuery(params.get("q") || ""); }, [params]);

  const search = (event) => {
    event.preventDefault();
    const next = query.trim();
    const nextParams = {};
    if (next) nextParams.q = next;
    if (category) nextParams.category = category;
    setParams(nextParams);
  };

  return (
    <div className="max-w-6xl mx-auto min-h-dvh bg-gray-50 md:my-4 md:rounded-3xl md:overflow-hidden">
      <div className="border-b border-gray-100 bg-white px-3 py-3 xs:px-4">
        <div className="mb-3"><h1 className="text-lg font-extrabold">Semua Produk</h1><p className="text-[10px] text-gray-400">Pilih dimsum favoritmu</p></div>
        <form onSubmit={search} className="flex items-center gap-2 bg-gray-100 min-h-11 px-3.5 rounded-xl focus-within:ring-2 focus-within:ring-primary/20"><Search size={17} className="text-gray-400" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produkâ€¦" className="flex-1 min-w-0 bg-transparent outline-none text-sm" /><button type="submit" className="text-gray-400 active:text-primary" aria-label="Cari produk"><SlidersHorizontal size={17} /></button></form>
      </div>

      <div className="p-3 xs:p-4 pb-24">
        {products === null ? (
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 md:grid-cols-4 sm:gap-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl sm:h-56 sm:rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState title={query ? `Produk â€œ${query}â€ tidak ditemukan` : "Belum ada produk"} description="Coba kata kunci lain atau periksa kembali nanti." />
        ) : (
          <><p className="mb-3 text-[11px] text-gray-500">{filtered.length} produk tersedia</p><ProductGrid products={filtered}/></>
        )}
      </div>
    </div>
  );
}



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
  const sort=params.get("sort")||"popular";
  const availableOnly=params.get("available")==="1";
  const products = useLiveCollection(TABLES.PRODUCTS, { filters: { is_active: true }, order: { column: "name" } });
  const catalog = mergeProductCatalog(products);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result=catalog.filter((product) => (!category || product.category_id === category) && (!availableOnly||Number(product.stock)>0) && (!term || `${product.name} ${product.description || ""}`.toLowerCase().includes(term)));
    return [...result].sort((a,b)=>sort==='price-low'?Number(a.price)-Number(b.price):sort==='price-high'?Number(b.price)-Number(a.price):sort==='newest'?new Date(b.created_at||0)-new Date(a.created_at||0):Number(b.sold_count||0)-Number(a.sold_count||0));
  }, [catalog, category, query, sort, availableOnly]);

  useEffect(() => { setQuery(params.get("q") || ""); }, [params]);

  const search = (event) => {
    event.preventDefault();
    const next = query.trim();
    const nextParams = {};
    if (next) nextParams.q = next;
    if (category) nextParams.category = category;
    if(sort!=='popular')nextParams.sort=sort;
    if(availableOnly)nextParams.available='1';
    setParams(nextParams);
  };

  return (
    <div className="mx-auto min-h-[calc(100dvh-8.5rem)] max-w-6xl bg-gray-50 md:my-4 md:overflow-hidden md:rounded-3xl">
      <div className="border-b border-gray-100 bg-white px-3 py-3 xs:px-4">
        <div className="mb-3"><h1 className="text-lg font-extrabold">Semua Produk</h1><p className="text-[10px] text-gray-400">Pilih dimsum favoritmu</p></div>
        <form onSubmit={search} className="flex items-center gap-2 bg-gray-100 min-h-11 px-3.5 rounded-xl focus-within:ring-2 focus-within:ring-primary/20"><Search size={17} className="text-gray-400" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produkâ€¦" className="flex-1 min-w-0 bg-transparent outline-none text-sm" /><button type="submit" className="text-gray-400 active:text-primary" aria-label="Cari produk"><SlidersHorizontal size={17} /></button></form>
        <div className="mt-2.5 flex gap-2"><select value={sort} onChange={(event)=>{const next=new URLSearchParams(params);event.target.value==='popular'?next.delete('sort'):next.set('sort',event.target.value);setParams(next);}} className="min-h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700"><option value="popular">Paling laris</option><option value="newest">Terbaru</option><option value="price-low">Harga termurah</option><option value="price-high">Harga termahal</option></select><button type="button" onClick={()=>{const next=new URLSearchParams(params);availableOnly?next.delete('available'):next.set('available','1');setParams(next);}} className={`min-h-10 rounded-xl border px-3 text-[10px] font-bold ${availableOnly?'border-primary bg-primary-50 text-primary':'border-gray-200 bg-white text-gray-600'}`}>Stok tersedia</button></div>
      </div>

      <div className="p-3 pb-24 xs:p-4">
        {products === null ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState title={query ? `Produk â€œ${query}â€ tidak ditemukan` : "Belum ada produk"} description="Coba kata kunci lain atau periksa kembali nanti." />
        ) : (
          <><p className="mb-3 text-[11px] text-gray-500">{filtered.length} produk tersedia</p><ProductGrid products={filtered}/></>
        )}
      </div>
    </div>
  );
}



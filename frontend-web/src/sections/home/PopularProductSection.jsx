import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { TABLES } from "../../supabase/constants.js";
import { ProductGrid } from "../../features/products/ProductGrid.jsx";
import { mergeProductCatalog } from "../../features/products/productAssets.js";

export default function PopularProductSection() {
  // Realtime: berubah otomatis begitu admin menambah / mengubah stok /
  // menonaktifkan produk dari Admin Dashboard.
  const products = useLiveCollection(TABLES.PRODUCTS, {
    order: { column: "sold_count", ascending: false },
  });
  // Jangan membuat katalog menghilang ketika Supabase lambat, tabel kosong,
  // atau cache schema belum diperbarui. Data server tetap menggantikan fallback
  // segera setelah tersedia.
  const catalog = mergeProductCatalog(products).slice(0, 12);

  if (Array.isArray(products) && catalog.length === 0) return null;

  return (
    <section className="mt-4 px-3 xs:px-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-dark sm:text-base">Produk Terlaris</h2>
        <Link to="/produk" className="flex items-center gap-0.5 text-[9px] font-semibold text-primary transition-all hover:gap-1 sm:text-sm">
          Lihat Semua
          <ChevronRight size={14} strokeWidth={2.5} />
        </Link>
      </div>

      <ProductGrid products={catalog}/>
    </section>
  );
}


import { useMemo } from "react";
import { ProductGrid } from "../../features/products/ProductGrid.jsx";
import { mergeProductCatalog } from "../../features/products/productAssets.js";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { useWishlist } from "../../hooks/useWishlist.js";
import { TABLES } from "../../supabase/constants.js";

export default function RecommendationSection() {
  const liveProducts = useLiveCollection(TABLES.PRODUCTS, { filters:{ is_active:true }, order:{ column:"recommendation_score", ascending:false } });
  const { ids } = useWishlist();
  const catalog = mergeProductCatalog(liveProducts);
  const recommendations = useMemo(() => {
    const favoriteCategories = new Set(catalog.filter((item) => ids.has(item.id)).map((item) => item.category_id).filter(Boolean));
    return [...catalog].filter((item) => !ids.has(item.id) && item.is_active !== false && Number(item.stock ?? 1) > 0).sort((a,b) => {
      const categoryScore = Number(favoriteCategories.has(b.category_id)) - Number(favoriteCategories.has(a.category_id));
      const recommendedScore = Number(b.is_recommended === true) - Number(a.is_recommended === true);
      return recommendedScore || categoryScore || Number(b.recommendation_score || 0) - Number(a.recommendation_score || 0) || Number(b.rating || 0) - Number(a.rating || 0) || Number(b.review_count || 0) - Number(a.review_count || 0);
    }).slice(0,3);
  }, [catalog, ids]);
  if (!recommendations.length) return null;
  return <section className="mt-5 px-3 xs:px-4"><h2 className="text-sm font-bold text-dark">Rekomendasi Pilihan</h2><p className="mb-2 mt-0.5 text-[9px] text-slate-500">Disusun berdasarkan penilaian, ulasan, dan produk yang paling diminati</p><ProductGrid products={recommendations}/></section>;
}

import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { TABLES } from "../../supabase/constants.js";
import ReviewCard from "../../components/cards/ReviewCard.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";

export default function CustomerReviewSection() {
  const reviews = useLiveCollection(TABLES.REVIEWS, {
    order: { column: "created_at", ascending: false },
    limit: 10,
  });

  if (reviews !== null && reviews.length === 0) return null;
  const average=reviews?.length?(reviews.reduce((sum,item)=>sum+Number(item.rating||5),0)/reviews.length).toFixed(1):"4.9";

  return (
    <section className="mt-6 px-4">
      <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-wider text-primary">Dipercaya pelanggan</p><h2 className="mt-0.5 text-base font-black text-dark">Ulasan Pelanggan</h2></div><div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-right"><strong className="text-sm text-amber-700">★ {average}</strong><p className="text-[8px] text-amber-700/60">{reviews?.length||0} ulasan terbaru</p></div></div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {reviews === null
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="min-w-[220px] xs:min-w-[240px] h-28 rounded-2xl" />)
          : reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>
    </section>
  );
}

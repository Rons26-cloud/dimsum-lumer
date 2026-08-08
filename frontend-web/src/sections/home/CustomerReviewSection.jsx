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

  return (
    <section className="mt-6 px-4">
      <h2 className="font-bold text-dark text-base mb-3">Ulasan Pelanggan</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {reviews === null
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="min-w-[220px] xs:min-w-[240px] h-28 rounded-2xl" />)
          : reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>
    </section>
  );
}

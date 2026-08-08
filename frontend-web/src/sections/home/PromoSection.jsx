import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { TABLES } from "../../supabase/constants.js";
import PromoCard from "../../components/cards/PromoCard.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";

export default function PromoSection() {
  // Realtime: promo baru dari admin langsung tampil, promo yang dinonaktifkan langsung hilang.
  const promos = useLiveCollection(TABLES.PROMOS, { filters: { is_active: true } });

  if (promos !== null && promos.length === 0) return null;

  return (
    <section className="mt-6 px-4">
      <h2 className="font-bold text-dark text-base mb-3">Promo Untukmu</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {promos === null
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="min-w-[240px] xs:min-w-[260px] h-24 rounded-2xl" />)
          : promos.map((p) => <PromoCard key={p.id} promo={p} />)}
      </div>
    </section>
  );
}

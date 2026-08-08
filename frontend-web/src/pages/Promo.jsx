import { useEffect, useState } from "react";
import { getActivePromos } from "../services/promoService.js";
import PromoCard from "../components/cards/PromoCard.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Button from "../components/ui/Button.jsx";

export default function Promo() {
  const [promos, setPromos] = useState(null);
  useEffect(() => { getActivePromos().then(setPromos).catch(() => setPromos([])); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-dark mb-4">Promo & Voucher</h1>
      {promos?.length === 0 && <EmptyState title="Belum ada promo aktif" />}
      <div className="grid gap-3">{promos?.map((p) => <PromoCard key={p.id} promo={p} />)}</div>
    </div>
  );
}

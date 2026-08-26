import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Beef, Soup, Pizza, CupSoda, Snowflake, Utensils } from "lucide-react";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { TABLES } from "../../supabase/constants.js";
import CategoryCard from "../../components/cards/CategoryCard.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";

const ICON_MAP = {
  daging: Beef,
  bakso: Soup,
  pizza: Pizza,
  minuman: CupSoda,
  goreng: Utensils,
  kukus: Soup,
  frozen: Snowflake,
};

const PLACEHOLDER_COLORS = ["bg-orange-100", "bg-rose-100", "bg-amber-100", "bg-emerald-100"];

export default function CategorySection() {
  const navigate = useNavigate();
  const categories = useLiveCollection(TABLES.CATEGORIES, { order: { column: "name" } });
  const [active, setActive] = useState("semua");

  const items = [
    { id: "semua", name: "Semua", Icon: Home, image_url: "" },
    ...(categories ?? []).map((c, index) => ({
      ...c,
      Icon: ICON_MAP[c.slug?.toLowerCase()] ?? Utensils,
      image_url: c.image_url || c.icon_url || "",
      _placeholder: PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length],
    })),
  ];

  return (
    <section className="mt-6">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto px-3 xs:px-4">
        {categories === null
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 w-14 xs:w-16">
                <Skeleton className="w-12 h-12 xs:w-14 xs:h-14 rounded-2xl" />
                <Skeleton className="h-2.5 w-10 rounded" />
              </div>
            ))
          : items.map((c) => (
              <CategoryCard
                key={c.id}
                category={c}
                active={active === c.id}
                onClick={() => { setActive(c.id); navigate(c.id === "semua" ? "/produk" : `/produk?category=${encodeURIComponent(c.id)}`); }}
              />
            ))}
      </div>
    </section>
  );
}

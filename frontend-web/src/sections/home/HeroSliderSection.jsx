import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import bannerMentai from "../../assets/banners/banner-mentai.jpg";
import bannerFamily from "../../assets/banners/banner-family.jpg";
import bannerFrozen from "../../assets/banners/banner-frozen.jpg";
import { supabase } from "../../supabase/client.js";
import { useRealtime } from "../../hooks/useRealtime.js";

const fallbackSlides = [
  { eyebrow: "Favorit pelanggan", title: "Mentai Lumer", subtitle: "Creamy, gurih, dan dibuat hangat saat dipesan.", cta: "Pesan Sekarang", to: "/produk", image: bannerMentai, position: "center" },
  { eyebrow: "Paket hemat keluarga", title: "Makin Ramai, Makin Hemat", subtitle: "Pilihan lengkap untuk dinikmati bersama.", cta: "Lihat Promo", to: "/promo", image: bannerFamily, position: "center" },
  { eyebrow: "Stok di rumah", title: "Dimsum Frozen", subtitle: "Praktis disimpan, mudah disajikan kapan saja.", cta: "Belanja Frozen", to: "/produk?category=frozen", image: bannerFrozen, position: "center" },
];

const fallbackById = new Map([
  ["frontend-mentai", fallbackSlides[0]],
  ["frontend-family", fallbackSlides[1]],
  ["frontend-frozen", fallbackSlides[2]],
]);

function normalizeBanner(item) {
  if (!item || item.is_active === false) return null;
  const localFallback = fallbackById.get(item.id);
  if (item.source === "frontend" || localFallback) {
    return { ...localFallback, title: item.title || localFallback.title, subtitle: item.subtitle ?? localFallback.subtitle, to: item.target_url || localFallback.to };
  }
  const imageUrl = String(item.image_url || "").trim();
  if (!/^https:\/\//i.test(imageUrl)) return null;
  return { eyebrow: "Promo pilihan", title: item.title || "Promo Dimsum Lumer", subtitle: item.subtitle || "", cta: "Lihat Sekarang", to: item.target_url || "/promo", image: imageUrl, position: "center" };
}

export default function HeroSliderSection() {
  const [slides, setSlides] = useState(fallbackSlides);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);

  const refreshBanners = async () => {
    const { data, error } = await supabase.from("app_config").select("value").eq("key", "home_banners").maybeSingle();
    if (error) return;
    if (!data) { setSlides(fallbackSlides); return; }
    const value = data.value || {};
    const configured = Array.isArray(value.items) ? value.items.map(normalizeBanner).filter(Boolean) : [];
    if (Array.isArray(value.items) && value.items.length > 0) {
      setSlides(configured.length > 0 ? configured : fallbackSlides);
      setActive(0);
    } else setSlides(fallbackSlides);
  };

  useEffect(() => { refreshBanners(); }, []);
  useRealtime("app_config", "*", refreshBanners, "key=eq.home_banners");

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 4500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const move = (direction) => { if (slides.length) setActive((current) => (current + direction + slides.length) % slides.length); };
  const handleTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
    touchStart.current = null;
  };

  return (
    <section className="mt-3 px-3 xs:px-4" aria-roledescription="carousel" aria-label="Promo Dimsum Lumer">
      {slides.length > 0 && <div className="relative aspect-[16/7] overflow-hidden rounded-xl shadow-sm xs:aspect-[16/7] sm:rounded-2xl md:aspect-[21/8]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; setPaused(true); }} onTouchEnd={(e) => { handleTouchEnd(e); setPaused(false); }}>
        {slides.map((slide, index) => (
          <div key={slide.title} className={`absolute inset-0 transition-opacity duration-700 ${index === active ? "opacity-100 z-10" : "opacity-0"}`} aria-hidden={index !== active}>
            <img src={slide.image} alt={slide.title} width="1280" height="853" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: slide.position }} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "low"} decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
            <div className="relative flex h-full max-w-[72%] flex-col justify-center px-4 py-3 sm:max-w-[58%] sm:px-8 sm:py-5">
              <p className="text-white/75 text-[9px] xs:text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1">{slide.eyebrow}</p>
              <h2 className="text-base font-extrabold leading-tight text-white xs:text-lg sm:text-4xl">{slide.title}</h2>
              <p className="mt-1 line-clamp-1 text-[8px] leading-relaxed text-white/85 xs:text-[9px] sm:mt-1.5 sm:text-sm">{slide.subtitle}</p>
              <Link to={slide.to} className="mt-2 inline-flex min-h-11 w-fit items-center rounded-xl bg-primary px-4 text-xs font-extrabold text-white shadow-[0_6px_18px_rgba(233,104,24,.35)] active:scale-95 sm:mt-5 sm:px-5 sm:text-sm">{slide.cta}</Link>
            </div>
          </div>
        ))}

        <button onClick={() => move(-1)} className="hidden sm:grid absolute z-20 left-3 top-1/2 -translate-y-1/2 w-9 h-9 place-items-center rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30" aria-label="Banner sebelumnya"><ChevronLeft size={19} /></button>
        <button onClick={() => move(1)} className="hidden sm:grid absolute z-20 right-3 top-1/2 -translate-y-1/2 w-9 h-9 place-items-center rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/30" aria-label="Banner berikutnya"><ChevronRight size={19} /></button>

        <div className="absolute z-20 bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
          {slides.map((slide, index) => <button key={slide.title} onClick={() => setActive(index)} className="grid h-11 w-8 place-items-center" aria-label={`Tampilkan banner ${index + 1}`} aria-current={index === active}><span className={`h-1 rounded-full transition-all ${index === active ? "w-4 bg-white" : "w-1 bg-white/70"}`}/></button>)}
        </div>
      </div>}
    </section>
  );
}

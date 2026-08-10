import SearchSection from "../sections/home/SearchSection.jsx";
import HeroSliderSection from "../sections/home/HeroSliderSection.jsx";
import CategorySection from "../sections/home/CategorySection.jsx";
import PromoSection from "../sections/home/PromoSection.jsx";
import FlashSaleSection from "../features/flash-sale/FlashSaleSection.jsx";
import PopularProductSection from "../sections/home/PopularProductSection.jsx";
import RecommendationSection from "../sections/home/RecommendationSection.jsx";
import OutletMapSection from "../sections/home/OutletMapSection.jsx";
import CustomerReviewSection from "../sections/home/CustomerReviewSection.jsx";
import InstallAppCard from "../components/pwa/InstallAppCard.jsx";

export default function Home() {
  return (
    <div className="animate-fade-in pb-10 max-w-6xl mx-auto bg-white min-h-dvh md:my-4 md:rounded-3xl md:shadow-card md:overflow-hidden">
      <SearchSection />
      <HeroSliderSection />
      <InstallAppCard />
      <CategorySection />
      <OutletMapSection />
      <PopularProductSection />
      <PromoSection />
      <FlashSaleSection />
      <RecommendationSection />
      <CustomerReviewSection />
    </div>
  );
}

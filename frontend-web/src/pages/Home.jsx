import { lazy, Suspense } from "react";
import SearchSection from "../sections/home/SearchSection.jsx";
import HeroSliderSection from "../sections/home/HeroSliderSection.jsx";
import CategorySection from "../sections/home/CategorySection.jsx";
import MemberOverviewSection from "../sections/home/MemberOverviewSection.jsx";

const InstallAppCard = lazy(() => import("../components/pwa/InstallAppCard.jsx"));
const OutletMapSection = lazy(() => import("../sections/home/OutletMapSection.jsx"));
const PopularProductSection = lazy(() => import("../sections/home/PopularProductSection.jsx"));
const PromoSection = lazy(() => import("../sections/home/PromoSection.jsx"));
const FlashSaleSection = lazy(() => import("../features/flash-sale/FlashSaleSection.jsx"));
const RecommendationSection = lazy(() => import("../sections/home/RecommendationSection.jsx"));
const CustomerReviewSection = lazy(() => import("../sections/home/CustomerReviewSection.jsx"));

const DeferredSection = ({ children }) => (
  <Suspense fallback={<div className="min-h-24" aria-hidden="true" />}>{children}</Suspense>
);

export default function Home() {
  return (
    <div className="animate-fade-in pb-10 max-w-6xl mx-auto bg-white min-h-dvh md:my-4 md:rounded-3xl md:shadow-card md:overflow-hidden">
      <SearchSection />
      <MemberOverviewSection />
      <HeroSliderSection />
      <DeferredSection><InstallAppCard /></DeferredSection>
      <CategorySection />
      <DeferredSection><OutletMapSection /></DeferredSection>
      <DeferredSection><PopularProductSection /></DeferredSection>
      <DeferredSection><PromoSection /></DeferredSection>
      <DeferredSection><FlashSaleSection /></DeferredSection>
      <DeferredSection><RecommendationSection /></DeferredSection>
      <DeferredSection><CustomerReviewSection /></DeferredSection>
    </div>
  );
}

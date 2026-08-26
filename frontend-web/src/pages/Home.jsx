import { lazy, Suspense } from "react";
import SearchSection from "../sections/home/SearchSection.jsx";
import CategorySection from "../sections/home/CategorySection.jsx";

const HeroSliderSection = lazy(() => import("../sections/home/HeroSliderSection.jsx"));
const MemberOverviewSection = lazy(() => import("../sections/home/MemberOverviewSection.jsx"));
const InstallAppCard = lazy(() => import("../components/pwa/InstallAppCard.jsx"));
const OutletMapSection = lazy(() => import("../sections/home/OutletMapSection.jsx"));
const PopularProductSection = lazy(() => import("../sections/home/PopularProductSection.jsx"));
const PromoSection = lazy(() => import("../sections/home/PromoSection.jsx"));
const FlashSaleSection = lazy(() => import("../features/flash-sale/FlashSaleSection.jsx"));
const RecommendationSection = lazy(() => import("../sections/home/RecommendationSection.jsx"));
const CustomerReviewSection = lazy(() => import("../sections/home/CustomerReviewSection.jsx"));
const FAQSection = lazy(() => import("../sections/home/FAQSection.jsx"));

const DeferredSection = ({ children }) => (
  <Suspense fallback={<div className="min-h-[60dvh]" aria-hidden="true" />}>{children}</Suspense>
);

export default function Home() {
  return (
    <div className="pb-10 max-w-6xl mx-auto bg-white min-h-dvh md:my-4 md:rounded-3xl md:shadow-card md:overflow-hidden">
      <header className="sr-only"><h1>Dimsum Lumer Medan – Pesan Dimsum Lezat Online</h1><p>Menu dimsum original, mentai, mozzarella, frozen, promo, dan paket pilihan untuk pemesanan praktis di Medan.</p></header>
      <SearchSection />
      <DeferredSection><MemberOverviewSection /></DeferredSection>
      <DeferredSection><HeroSliderSection /></DeferredSection>
      <DeferredSection><InstallAppCard /></DeferredSection>
      <CategorySection />
      <DeferredSection><OutletMapSection /></DeferredSection>
      <DeferredSection><PopularProductSection /></DeferredSection>
      <DeferredSection><PromoSection /></DeferredSection>
      <DeferredSection><FlashSaleSection /></DeferredSection>
      <DeferredSection><RecommendationSection /></DeferredSection>
      <DeferredSection><CustomerReviewSection /></DeferredSection>
      <DeferredSection><FAQSection /></DeferredSection>
    </div>
  );
}

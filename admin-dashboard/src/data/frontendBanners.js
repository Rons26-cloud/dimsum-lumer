import bannerMentai from "../../../frontend-web/src/assets/banners/banner-mentai.jpg";
import bannerFamily from "../../../frontend-web/src/assets/banners/banner-family.jpg";
import bannerFrozen from "../../../frontend-web/src/assets/banners/banner-frozen.jpg";

export const FRONTEND_BANNERS = [
  { id: "frontend-mentai", title: "Mentai Lumer", subtitle: "Creamy, gurih, dan dibuat hangat saat dipesan.", image_url: bannerMentai, target_url: "/produk", is_active: true, source: "frontend" },
  { id: "frontend-family", title: "Makin Ramai, Makin Hemat", subtitle: "Pilihan lengkap untuk dinikmati bersama.", image_url: bannerFamily, target_url: "/promo", is_active: true, source: "frontend" },
  { id: "frontend-frozen", title: "Dimsum Frozen", subtitle: "Praktis disimpan, mudah disajikan kapan saja.", image_url: bannerFrozen, target_url: "/produk?category=frozen", is_active: true, source: "frontend" },
];

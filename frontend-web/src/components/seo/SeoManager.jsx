import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ORIGIN = "https://dimsum-lumerr.pages.dev";
const DEFAULT = {
  title: "Dimsum Lumer Medan | Pesan Dimsum Lezat Online",
  description: "Pesan Dimsum Lumer di Medan secara online. Pilih dimsum mentai, original, frozen, promo, dan menu favorit dengan pemesanan praktis.",
};

const pages = {
  "/": DEFAULT,
  "/produk": { title: "Menu Dimsum Lumer Medan | Original, Mentai & Frozen", description: "Lihat menu dan harga Dimsum Lumer: dimsum original, mentai, mozzarella, udang, frozen, dan pilihan favorit lainnya." },
  "/promo": { title: "Promo Dimsum Lumer Terbaru | Pesan Hemat Online", description: "Temukan promo dan paket hemat Dimsum Lumer terbaru untuk pemesanan online di Medan." },
  "/lokasi-toko": { title: "Lokasi Dimsum Lumer Medan | Jam Buka & Petunjuk", description: "Temukan lokasi, jam operasional, dan petunjuk menuju outlet Dimsum Lumer di Medan." },
  "/login": { title: "Login Pelanggan | Dimsum Lumer", description: "Masuk ke akun Dimsum Lumer untuk melihat pesanan, poin, reward, dan promo pelanggan." },
  "/register": { title: "Daftar Member Dimsum Lumer", description: "Buat akun member Dimsum Lumer untuk memperoleh poin, reward, promo, dan kemudahan pemesanan." },
};

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
}

export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const exact = pages[pathname];
    const productDetail = pathname.startsWith("/produk/");
    const page = exact || (productDetail ? {
      title: "Detail Menu Dimsum Lumer | Pesan Online",
      description: "Lihat detail, varian, harga, dan ketersediaan menu Dimsum Lumer lalu pesan secara online.",
    } : DEFAULT);
    const indexable = Boolean(exact || productDetail);
    const canonical = `${ORIGIN}${pathname === "/" ? "/" : pathname}`;

    document.title = page.title;
    setMeta('meta[name="description"]', { name: "description", content: page.description });
    setMeta('meta[name="robots"]', { name: "robots", content: indexable ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, follow" });
    setMeta('meta[property="og:title"]', { property: "og:title", content: page.title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: page.description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: page.title });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: page.description });
    const link = document.head.querySelector('link[rel="canonical"]');
    if (link) link.href = canonical;
  }, [pathname]);

  return null;
}

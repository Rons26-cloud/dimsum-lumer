import originalImage from "../../../frontend-web/src/assets/produk/original.jpg";
import shrimpImage from "../../../frontend-web/src/assets/produk/udang.jpg";
import mozzarellaImage from "../../../frontend-web/src/assets/produk/mozarella.jpg";
import friedWontonImage from "../../../frontend-web/src/assets/produk/pangsit-goreng-lumer.jpg";
import spicyImage from "../../../frontend-web/src/assets/produk/pedas.jpg";
import cheeseImage from "../../../frontend-web/src/assets/produk/keju.jpg";
import bbqImage from "../../../frontend-web/src/assets/produk/bbq.jpg";
import mixImage from "../../../frontend-web/src/assets/produk/mix.jpg";
import cornImage from "../../../frontend-web/src/assets/produk/jagung.jpg";
import mushroomImage from "../../../frontend-web/src/assets/produk/jamur.jpg";
import sausageImage from "../../../frontend-web/src/assets/produk/sosis.jpg";
import premiumChickenImage from "../../../frontend-web/src/assets/produk/ayampremium.jpg";

export const FRONTEND_CATALOG = [
  { id: "frontend-dimsum-ayam-original", slug: "dimsum-ayam-original", name: "Dimsum Ayam Original", description: "Dimsum ayam juicy dengan kulit tipis, isi 4.", price: 20000, stock: 100, image_url: originalImage, is_active: true },
  { id: "frontend-dimsum-udang", slug: "dimsum-udang", name: "Dimsum Udang", description: "Dimsum dengan isian udang segar pilihan.", price: 20000, stock: 100, image_url: shrimpImage, is_active: true },
  { id: "frontend-dimsum-mozarella", slug: "dimsum-mozarella", name: "Dimsum Mozarella", description: "Dimsum ayam dengan keju mozarella lumer.", price: 18000, stock: 100, image_url: mozzarellaImage, is_active: true },
  { id: "frontend-pangsit-goreng-lumer", slug: "pangsit-goreng-lumer", name: "Pangsit Goreng Lumer", description: "Pangsit ayam udang renyah dengan saus spesial, isi 4.", price: 18000, stock: 100, image_url: friedWontonImage, is_active: true },
  { id: "frontend-dimsum-pedas", slug: "dimsum-pedas", name: "Dimsum Pedas", description: "Dimsum ayam dengan saus cabai pedas spesial.", price: 20000, stock: 100, image_url: spicyImage, is_active: true },
  { id: "frontend-dimsum-keju", slug: "dimsum-keju", name: "Dimsum Keju", description: "Dimsum gurih dengan saus dan parutan keju.", price: 20000, stock: 100, image_url: cheeseImage, is_active: true },
  { id: "frontend-dimsum-bbq", slug: "dimsum-bbq", name: "Dimsum BBQ", description: "Dimsum dengan saus BBQ manis dan smoky.", price: 22000, stock: 100, image_url: bbqImage, is_active: true },
  { id: "frontend-dimsum-mix", slug: "dimsum-mix", name: "Dimsum Mix", description: "Kombinasi berbagai varian dimsum favorit.", price: 22000, stock: 100, image_url: mixImage, is_active: true },
  { id: "frontend-dimsum-jagung", slug: "dimsum-jagung", name: "Dimsum Jagung", description: "Dimsum ayam dengan topping jagung manis.", price: 20000, stock: 100, image_url: cornImage, is_active: true },
  { id: "frontend-dimsum-jamur", slug: "dimsum-jamur", name: "Dimsum Jamur", description: "Dimsum ayam dengan jamur gurih pilihan.", price: 20000, stock: 100, image_url: mushroomImage, is_active: true },
  { id: "frontend-dimsum-sosis", slug: "dimsum-sosis", name: "Dimsum Sosis", description: "Dimsum ayam dengan topping sosis panggang.", price: 20000, stock: 100, image_url: sausageImage, is_active: true },
  { id: "frontend-dimsum-ayam-premium", slug: "dimsum-ayam-premium", name: "Dimsum Ayam Premium", description: "Dimsum berisi ayam premium yang padat dan juicy.", price: 25000, stock: 100, image_url: premiumChickenImage, is_active: true },
];

const keyOf = (product) => String(product.slug || product.name || "").trim().toLowerCase();

export function mergeFrontendCatalog(databaseProducts = []) {
  const databaseByKey = new Map(databaseProducts.map((product) => [keyOf(product), product]));
  const merged = FRONTEND_CATALOG.map((fallback) => {
    const databaseProduct = databaseByKey.get(keyOf(fallback));
    if (!databaseProduct) return fallback;
    databaseByKey.delete(keyOf(fallback));
    return {
      ...fallback,
      ...databaseProduct,
      image_url: databaseProduct.image_url || databaseProduct.image || fallback.image_url,
      description: databaseProduct.description || fallback.description,
    };
  });
  return [...merged, ...databaseByKey.values()];
}

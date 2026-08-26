const LOCAL_IMAGE_BY_SLUG = {
  "dimsum-ayam-original": new URL("../../assets/produk/original.jpg", import.meta.url).href,
  "dimsum-udang": new URL("../../assets/produk/udang.jpg", import.meta.url).href,
  "dimsum-mozarella": new URL("../../assets/produk/mozarella.jpg", import.meta.url).href,
  "dimsum-mozzarella": new URL("../../assets/produk/mozarella.jpg", import.meta.url).href,
  "pangsit-goreng-lumer": new URL("../../assets/produk/pangsit-goreng-lumer.jpg", import.meta.url).href,
  "dimsum-pedas": new URL("../../assets/produk/pedas.jpg", import.meta.url).href,
  "dimsum-keju": new URL("../../assets/produk/keju.jpg", import.meta.url).href,
  "dimsum-bbq": new URL("../../assets/produk/bbq.jpg", import.meta.url).href,
  "dimsum-mix": new URL("../../assets/produk/mix.jpg", import.meta.url).href,
  "dimsum-jagung": new URL("../../assets/produk/jagung.jpg", import.meta.url).href,
  "dimsum-jamur": new URL("../../assets/produk/jamur.jpg", import.meta.url).href,
  "dimsum-sosis": new URL("../../assets/produk/sosis.jpg", import.meta.url).href,
  "dimsum-ayam-premium": new URL("../../assets/produk/ayampremium.jpg", import.meta.url).href,
};

const _nameImage = (name) => {
  if (name.includes("ayam premium")) return new URL("../../assets/produk/ayampremium.jpg", import.meta.url).href;
  if (name.includes("pangsit")) return new URL("../../assets/produk/pangsit-goreng-lumer.jpg", import.meta.url).href;
  if (name.includes("udang")) return new URL("../../assets/produk/udang.jpg", import.meta.url).href;
  if (name.includes("moza") || name.includes("mentai")) return new URL("../../assets/produk/mozarella.jpg", import.meta.url).href;
  if (name.includes("pedas")) return new URL("../../assets/produk/pedas.jpg", import.meta.url).href;
  if (name.includes("keju")) return new URL("../../assets/produk/keju.jpg", import.meta.url).href;
  if (name.includes("bbq")) return new URL("../../assets/produk/bbq.jpg", import.meta.url).href;
  if (name.includes("mix")) return new URL("../../assets/produk/mix.jpg", import.meta.url).href;
  if (name.includes("jagung")) return new URL("../../assets/produk/jagung.jpg", import.meta.url).href;
  if (name.includes("jamur")) return new URL("../../assets/produk/jamur.jpg", import.meta.url).href;
  if (name.includes("sosis")) return new URL("../../assets/produk/sosis.jpg", import.meta.url).href;
  if (name.includes("ayam") || name.includes("original")) return new URL("../../assets/produk/original.jpg", import.meta.url).href;
  return "";
};


export function mergeProductCatalog(serverProducts) {
  if (!Array.isArray(serverProducts)) return [];
  return serverProducts
    .map((product) => ({
      ...product,
      name: String(product?.name || product?.title || "Produk Dimsum").trim(),
      slug: String(product?.slug || product?.id || "").trim(),
      image_url: product?.image_url || product?.image || "",
    }))
    .filter((product) => product.is_active !== false);
}

export function resolveProductImage(product) {
  if (product?.image_url || product?.image) return product.image_url || product.image;
  const slug = String(product?.slug || "").toLowerCase();
  if (LOCAL_IMAGE_BY_SLUG[slug]) return LOCAL_IMAGE_BY_SLUG[slug];
  const name = String(product?.name || product?.title || "").toLowerCase();
  return _nameImage(name);
}

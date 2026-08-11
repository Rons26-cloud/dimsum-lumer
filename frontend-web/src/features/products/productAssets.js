import original from "../../assets/produk/original.jpg";
import udang from "../../assets/produk/udang.jpg";
import mozarella from "../../assets/produk/mozarella.jpg";
import pangsit from "../../assets/produk/pangsit-goreng-lumer.jpg";
import pedas from "../../assets/produk/pedas.jpg";
import keju from "../../assets/produk/keju.jpg";
import bbq from "../../assets/produk/bbq.jpg";
import mix from "../../assets/produk/mix.jpg";
import jagung from "../../assets/produk/jagung.jpg";
import jamur from "../../assets/produk/jamur.jpg";
import sosis from "../../assets/produk/sosis.jpg";
import ayamPremium from "../../assets/produk/ayampremium.jpg";

const LOCAL_IMAGE_BY_SLUG = {
  "dimsum-ayam-original": original,
  "dimsum-udang": udang,
  "dimsum-mozarella": mozarella,
  "dimsum-mozzarella": mozarella,
  "pangsit-goreng-lumer": pangsit,
  "dimsum-pedas": pedas,
  "dimsum-keju": keju,
  "dimsum-bbq": bbq,
  "dimsum-mix": mix,
  "dimsum-jagung": jagung,
  "dimsum-jamur": jamur,
  "dimsum-sosis": sosis,
  "dimsum-ayam-premium": ayamPremium,
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
  if (name.includes("ayam premium")) return ayamPremium;
  if (name.includes("pangsit")) return pangsit;
  if (name.includes("udang")) return udang;
  if (name.includes("moza") || name.includes("mentai")) return mozarella;
  if (name.includes("pedas")) return pedas;
  if (name.includes("keju")) return keju;
  if (name.includes("bbq")) return bbq;
  if (name.includes("mix")) return mix;
  if (name.includes("jagung")) return jagung;
  if (name.includes("jamur")) return jamur;
  if (name.includes("sosis")) return sosis;
  if (name.includes("ayam") || name.includes("original")) return original;
  return "";
}

const _images = [
  new URL("../../assets/flashsale/dimsum-ayam-original.jpg", import.meta.url).href,
  new URL("../../assets/flashsale/dimsum-mentai-mozzarella.jpg", import.meta.url).href,
  new URL("../../assets/flashsale/dimsum-udang-spesial.jpg", import.meta.url).href,
  new URL("../../assets/flashsale/pangsit-goreng-lumer.jpg", import.meta.url).href,
];

const _byName = (name) => {
  if (name.includes("udang")) return _images[2];
  if (name.includes("moza") || name.includes("mentai") || name.includes("keju")) return _images[1];
  if (name.includes("pangsit")) return _images[3];
  if (name.includes("ayam") || name.includes("original")) return _images[0];
  return "";
};

export function resolveFlashSaleImage(product, index = 0) {
  const name = (product?.name || "").toLowerCase();
  return _byName(name) || _images[index % _images.length];
}

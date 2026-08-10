export const productStock = (product) => {
  const value = Number(product?.stock);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
};
export const isOutOfStock = (product) => productStock(product) === 0 || product?.is_active === false;
export const isLowStock = (product, limit = 5) => {
  const stock = productStock(product);
  return stock !== null && stock > 0 && stock <= limit;
};
export const maxPurchasable = (product, fallback = 99) => productStock(product) ?? fallback;

// Nama tabel & bucket disatukan di sini supaya semua service/hook memakai
// referensi yang sama persis (hindari typo string di banyak file).

export const TABLES = {
  PROFILES: "profiles",
  PRODUCTS: "products",
  CATEGORIES: "categories",
  ORDERS: "orders",
  ORDER_DETAIL: "order_detail",
  MEMBER_POINT: "member_point",
  REWARDS: "rewards",
  WISHLIST: "wishlist",
  REVIEWS: "reviews",
  NOTIFICATIONS: "notifications",
  ACTIVITY_LOGS: "activity_logs",
  MAINTENANCE: "maintenance",
  ADDRESSES: "addresses",
  CART_ITEMS: "cart_items",
  STORES: "stores",
  PROMOS: "promos",
};

export const BUCKETS = {
  PRODUCT_IMAGES: "product-images",
  BANNERS: "banners",
  AVATARS: "avatars",
  STORE_PHOTOS: "store-photos",
};

export const REALTIME_CHANNELS = {
  ORDERS: "realtime-orders",
  NOTIFICATIONS: "realtime-notifications",
  MAINTENANCE: "realtime-maintenance",
};

export const ADMIN_WA_NUMBER = import.meta.env.VITE_ADMIN_WA_NUMBER;

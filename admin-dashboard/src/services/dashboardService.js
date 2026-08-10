import { supabase } from "../supabase/client.js";
import { cleanText, safeNumber } from "../utils/security.js";
import { validateApkFile } from "../supabase/storage.js";

export const DEFAULT_STORE_INFO = {
  name: "Dimsum Lumer - Hongkong Fashion", address: "Hongkong Fashion, Jalan Sisingamangaraja, Sudirejo II, Medan Amplas, Kota Medan, Sumatera Utara 20147", latitude: 3.570776, longitude: 98.694665, phone: "6288807597952", is_open: true, open_time: "10:00", close_time: "22:00",
};
export const DEFAULT_APK_VERSION = {
  version: "1.0.0", download_url: "", force_update: false, uploaded_at: null, file_size: 0,
};
const CONFIG_KEYS = new Set(["store_info", "apk_version", "home_banners"]);
const ORDER_STATUSES = new Set(["pending", "processing", "shipping", "completed", "cancelled"]);
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

function safeApkUrl(value) {
  if (!value) return "";
  let url;
  try { url = new URL(String(value)); } catch { throw new Error("URL APK tidak valid."); }
  const supabaseHost = (() => { try { return new URL(import.meta.env.VITE_SUPABASE_URL).host.toLowerCase(); } catch { return ""; } })();
  const allowedHosts = new Set([
    supabaseHost,
    ...(import.meta.env.VITE_APK_ALLOWED_HOSTS || "").split(",").map((host) => host.trim().toLowerCase()),
  ].filter(Boolean));
  if (url.protocol !== "https:" || url.username || url.password || !allowedHosts.has(url.host.toLowerCase()) || !url.pathname.toLowerCase().endsWith(".apk")) {
    throw new Error("URL APK wajib HTTPS, berakhiran .apk, dan berasal dari domain distribusi resmi.");
  }
  return url.toString();
}

const unwrapConfig = (row, fallback) => ({ ...fallback, ...(row?.value || row?.config_value || {}) });
const orderTotal = (order) => Number(order.total_price ?? order.total_amount ?? order.total ?? 0);
const normalizedStatus = (status) => ({ dibatalkan: "cancelled", selesai: "completed", diproses: "processing", dikirim: "shipping" }[status] || status);

async function rows(table, select = "*") {
  const { data, error } = await supabase.from(table).select(select);
  if (error) throw error;
  return data || [];
}

async function optionalRows(table, select = "*") {
  try { return await rows(table, select); }
  catch (error) {
    if (["42P01", "PGRST205"].includes(error.code) || /does not exist|schema cache/i.test(error.message || "")) return [];
    throw error;
  }
}

async function getProfiles() {
  const response = await supabase.from("profiles").select("id,full_name,created_at");
  if (!response.error) return response.data || [];
  if (response.error.code === "42703" || /created_at.*does not exist/i.test(response.error.message || "")) {
    const fallback = await supabase.from("profiles").select("id,full_name");
    if (fallback.error) throw fallback.error;
    return fallback.data || [];
  }
  throw response.error;
}

async function getOrderItems() {
  const modern = await optionalRows("order_items");
  if (modern.length) return modern.map((item) => ({ ...item, quantity: item.quantity ?? 0 }));
  const legacy = await optionalRows("order_detail");
  return legacy.map((item) => ({ ...item, quantity: item.qty ?? item.jumlah ?? 0 }));
}

export async function getApkStorageUsage() {
  const { data, error } = await supabase.storage.from("apk").list("releases", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
  if (error) return { bytes: 0, files: 0 };
  return { bytes: (data || []).reduce((sum, file) => sum + Number(file.metadata?.size || 0), 0), files: data?.length || 0 };
}

export async function getConfig(key, fallback = {}) {
  const { data, error } = await supabase.from("app_config").select("*").eq("key", key).maybeSingle();
  if (error) throw error;
  return unwrapConfig(data, fallback);
}

export async function updateConfig(key, value) {
  if (!CONFIG_KEYS.has(key)) throw new Error("Konfigurasi tidak diizinkan.");
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Nilai konfigurasi tidak valid.");
  const normalizedValue = key === "apk_version" ? { ...value, download_url: safeApkUrl(value.download_url) } : value;
  const payload = { key, value: normalizedValue, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from("app_config").upsert(payload, { onConflict: "key" }).select().single();
  if (error) throw error;
  return unwrapConfig(data, normalizedValue);
}

export async function updateStoreInfo(value) {
  const normalized={
    name:cleanText(value.name,{field:"Nama toko",maxLength:120,required:true}),
    address:cleanText(value.address,{field:"Alamat",maxLength:500,required:true}),
    phone:cleanText(value.phone,{field:"Nomor telepon",maxLength:20}),
    latitude:safeNumber(value.latitude,{field:"Latitude",min:-90,max:90}),
    longitude:safeNumber(value.longitude,{field:"Longitude",min:-180,max:180}),
    open_time:/^([01]\d|2[0-3]):[0-5]\d$/.test(value.open_time?.slice?.(0,5))?value.open_time.slice(0,5):"08:00",
    close_time:/^([01]\d|2[0-3]):[0-5]\d$/.test(value.close_time?.slice?.(0,5))?value.close_time.slice(0,5):"21:00",
    is_open:value.is_open!==false,
  };
  const config=await updateConfig("store_info",normalized);
  const { data:current, error:readError }=await supabase.from("stores").select("id").order("created_at",{ascending:true}).limit(1).maybeSingle();
  if(readError)throw readError;
  const payload={...normalized,phone:normalized.phone||null};
  const query=current?.id?supabase.from("stores").update(payload).eq("id",current.id):supabase.from("stores").insert(payload);
  const {error}=await query;if(error)throw error;
  return config;
}

export async function uploadApk(file, version, onProgress) {
  if (!file) return null;
  if (!VERSION_PATTERN.test(version || "")) throw new Error("Nomor versi harus menggunakan format x.y.z.");
  await validateApkFile(file);
  const safeVersion = version.replace(/[^0-9A-Za-z._-]/g, "-");
  const path = `releases/dimsum-lumer-${safeVersion}-${Date.now()}.apk`;
  onProgress?.(10);
  const { error } = await supabase.storage.from("apk").upload(path, file, { contentType: "application/vnd.android.package-archive", upsert: false });
  if (error) {
    if (/bucket not found/i.test(error.message || "")) throw new Error('Bucket "apk" belum dibuat. Jalankan migration Storage Supabase.');
    throw error;
  }
  onProgress?.(100);
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const sha256 = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return { url: supabase.storage.from("apk").getPublicUrl(path).data.publicUrl, size: file.size, path, sha256 };
}

export async function updateOrderStatus(id, status) {
  if (!id) throw new Error("ID pesanan tidak valid.");
  if (!ORDER_STATUSES.has(status)) throw new Error("Status pesanan tidak valid.");
  let response = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
  if (response.error && (response.error.code === "42703" || /updated_at.*does not exist|schema cache/i.test(response.error.message || ""))) {
    response = await supabase.from("orders").update({ status }).eq("id", id).select("id").maybeSingle();
  }
  if (response.error) throw response.error;
  if (!response.data?.id) throw new Error("Status pesanan tidak berubah. Periksa izin admin Supabase.");
}

export async function getDashboardData() {
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const [orders, profiles, products, categories, orderItems, configuredStore, apkVersion, apkStorage, stores] = await Promise.all([
    rows("orders"), getProfiles(), rows("products"), rows("categories"),
    getOrderItems(), getConfig("store_info", DEFAULT_STORE_INFO), getConfig("apk_version", DEFAULT_APK_VERSION), getApkStorageUsage(), optionalRows("stores"),
  ]);
  const primaryStore=stores[0];
  const storeInfo={...DEFAULT_STORE_INFO,...configuredStore,...(primaryStore?{name:primaryStore.name,address:primaryStore.address,latitude:primaryStore.latitude,longitude:primaryStore.longitude,phone:primaryStore.phone,open_time:primaryStore.open_time?.slice?.(0,5)||primaryStore.open_time,close_time:primaryStore.close_time?.slice?.(0,5)||primaryStore.close_time,is_open:primaryStore.is_open}: {})};
  const productsById = new Map(products.map((product) => [product.id, product]));
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const validOrders = orders.filter((o) => normalizedStatus(o.status) !== "cancelled");
  const completedIds = new Set(orders.filter((o) => normalizedStatus(o.status) === "completed").map((o) => o.id));
  const completedItems = orderItems.filter((item) => completedIds.has(item.order_id));
  const byDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart); date.setDate(date.getDate() + index);
    const dayOrders = validOrders.filter((o) => new Date(o.created_at).toDateString() === date.toDateString());
    return { date: date.toLocaleDateString("id-ID", { weekday: "short" }), sales: dayOrders.reduce((sum, o) => sum + orderTotal(o), 0), orders: dayOrders.length };
  });
  const bestSellerMap = new Map();
  completedItems.forEach((item) => {
    const product = productsById.get(item.product_id);
    const current = bestSellerMap.get(item.product_id) || { id: item.product_id, name: item.product_name || product?.name || "Produk", image_url: product?.image_url, price: item.price ?? product?.price, sold: 0 };
    current.sold += Number(item.quantity || 0); bestSellerMap.set(item.product_id, current);
  });
  const productCatalog = [...products]
    .map((product) => ({
      ...product,
      name: product.name || product.nama || "Produk tanpa nama",
      description: product.description || product.deskripsi || "",
      price: Number(product.price ?? product.harga ?? 0),
      image_url: product.image_url || product.image || product.gambar || null,
      stock: Number(product.stock ?? 0),
      is_active: product.is_active ?? product.status !== "nonaktif",
    }))
    .sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name, "id"));
  const categoryData = categories.map((category) => ({ name: category.name, value: products.filter((p) => p.category_id === category.id).length }));
  const statuses = orders.reduce((acc, order) => { const key = normalizedStatus(order.status); acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  return {
    stats: { totalOrders: orders.length, totalSales: validOrders.reduce((sum, o) => sum + orderTotal(o), 0), newCustomers: profiles.filter((p) => p.created_at && new Date(p.created_at) >= weekStart).length, productsSold: completedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0) },
    salesChart: byDay, categories: categoryData, bestSellers: [...bestSellerMap.values()].sort((a, b) => b.sold - a.sold).slice(0, 5),
    orderStatuses: statuses, productCatalog, recentOrders: [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map((order) => ({ ...order, customer_name: order.customer_name || profilesById.get(order.user_id)?.full_name })), storeInfo, apkVersion, apkStorage,
  };
}

export function subscribeDashboard(onChange, onStatus) {
  const channel = supabase.channel(`dashboard-control-${Date.now()}`);
  ["orders", "order_items", "order_detail", "products", "categories", "profiles", "stores", "app_config"].forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
  });
  channel.subscribe((status) => onStatus?.(status));
  return () => supabase.removeChannel(channel);
}

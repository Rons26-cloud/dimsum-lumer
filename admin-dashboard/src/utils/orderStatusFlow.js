export const ORDER_FLOW = ["pending", "processing", "shipping", "completed"];
export const PAID_STATUSES = new Set(["paid", "verified", "success", "settlement"]);

export function normalizeOrderStatus(value) {
  return ({ menunggu: "pending", diproses: "processing", dikirim: "shipping", selesai: "completed", dibatalkan: "cancelled" }[String(value || "").toLowerCase()] || value || "pending");
}

export function validateOrderStatusChange(order, nextStatus) {
  const current = normalizeOrderStatus(order?.status);
  const next = normalizeOrderStatus(nextStatus);
  if (next === current) return null;
  if (["completed", "cancelled"].includes(current)) return "Pesanan yang sudah selesai atau dibatalkan tidak dapat diubah lagi.";
  if (next === "cancelled") return null;
  const currentIndex = ORDER_FLOW.indexOf(current);
  const nextIndex = ORDER_FLOW.indexOf(next);
  if (currentIndex < 0 || nextIndex !== currentIndex + 1) return "Status harus diperbarui berurutan: konfirmasi, diproses, dikirim, lalu selesai.";
  if (next === "completed" && !PAID_STATUSES.has(String(order?.payment_status || "").toLowerCase())) return "Pembayaran belum terverifikasi. Pesanan belum dapat diselesaikan.";
  return null;
}

export const canChangeOrderStatus = (order, nextStatus) => validateOrderStatusChange(order, nextStatus) === null;

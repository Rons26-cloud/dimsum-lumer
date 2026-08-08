import { getAll, updateRow } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";

export const getRecentOrders = (limit = 5) =>
  getAll(TABLES.ORDERS, { order: { column: "created_at", ascending: false }, limit });
export const getOrdersByStatus = (status) => getAll(TABLES.ORDERS, { filters: { status } });
export const updateOrderStatus = (id, status) => updateRow(TABLES.ORDERS, id, { status });

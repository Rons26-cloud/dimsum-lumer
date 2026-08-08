import { getAll, getById, insertRow, updateRow } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";
import { supabase } from "../supabase/client.js";

export const createOrder = (payload) => insertRow(TABLES.ORDERS, payload);

export const getOrderById = (id) => getById(TABLES.ORDERS, id);

export const getOrdersByUser = (userId) =>
  getAll(TABLES.ORDERS, { 
    filters: { user_id: userId }, 
    order: { column: "created_at", ascending: false } 
  });

export async function getOrderStats(userId) {
  const { data, error } = await supabase
    .from(TABLES.ORDERS)
    .select("id,order_code,status,shipping_method,created_at,updated_at,cancelled_at,cancellation_reason")
    .eq("user_id", userId)
    .order("created_at", { ascending:false });
  if (error) throw error;
  const rows=data||[];
  const stats=rows.reduce((result,order)=>{result.total+=1;result[order.status]=(result[order.status]||0)+1;return result;},{total:0,pending:0,processing:0,shipping:0,completed:0,cancelled:0});
  stats.latestOrder=rows.find((order)=>!['completed','cancelled'].includes(order.status))||rows[0]||null;
  return stats;
}

export const updateOrderStatus = (id, status) => updateRow(TABLES.ORDERS, id, { status });

export const updateOrderStatusAndLocation = (id, status, lat, lng) => 
  updateRow(TABLES.ORDERS, id, { status, customer_lat: lat, customer_lng: lng });

import { supabase } from "./client.js";
import { TABLES } from "./constants.js";
import { safeId } from "../utils/security.js";

const ALLOWED_TABLES = new Set([...Object.values(TABLES), "wishlist", "apk_versions", "store_settings"]);
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/i;
const SELECT_EXPRESSION = /^[a-z0-9_*,()\s]+$/i;

function safeTable(table) {
  if (!ALLOWED_TABLES.has(table)) throw new Error("Tabel tidak diizinkan.");
  return table;
}

function safeColumn(column) {
  if (!IDENTIFIER.test(column)) throw new Error("Kolom tidak valid.");
  return column;
}

export async function getAll(table, { select = "*", filters = {}, order, limit } = {}) {
  safeTable(table);
  if (!SELECT_EXPRESSION.test(select)) throw new Error("Kolom select tidak valid.");
  let query = supabase.from(table).select(select);
  Object.entries(filters).forEach(([key, value]) => { query = query.eq(safeColumn(key), value); });
  if (order) query = query.order(safeColumn(order.column), { ascending: order.ascending ?? true });
  if (limit) query = query.limit(Math.min(Math.max(Number(limit) || 1, 1), 1000));
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCount(table, filters = {}) {
  safeTable(table);
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  Object.entries(filters).forEach(([key, value]) => { query = query.eq(safeColumn(key), value); });
  const { count, error } = await query;
  if (error) throw error;
  return count;
}

export async function insertRow(table, payload) {
  safeTable(table);
  const { data, error } = await supabase.from(table).insert(payload).select();
  if (error) throw error;
  return data;
}

export async function updateRow(table, id, payload) {
  safeTable(table);
  safeId(id);
  const { data, error } = await supabase.from(table).update(payload).eq("id", id).select();
  if (error) throw error;
  return data;
}

export async function deleteRow(table, id) {
  safeTable(table);
  safeId(id);
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
  return true;
}

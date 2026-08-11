import { supabase } from "./client";


export async function getAll(table, { select = "*", filters = {}, order, limit } = {}) {
  let query = supabase.from(table).select(select);
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  if (order) query = query.order(order.column, { ascending: order.ascending ?? true });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getById(table, id, select = "*") {
  const { data, error } = await supabase.from(table).select(select).eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function insertRow(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select();
  if (error) throw error;
  return data;
}

export async function updateRow(table, id, payload) {
  const { data, error } = await supabase.from(table).update(payload).eq("id", id).select();
  if (error) throw error;
  return data;
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
  return true;
}

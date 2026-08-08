import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";

const table = () => supabase.from(TABLES.NOTIFICATIONS);

export async function getUserNotifications(userId) {
  const { data, error } = await table().select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getNotification(id, userId) {
  const { data, error } = await table().select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function markAsRead(id, userId) {
  const { error } = await table().update({ is_read: true }).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function markAllAsRead(userId) {
  const { error } = await table().update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  if (error) throw error;
}

export async function deleteNotification(id, userId) {
  const { error } = await table().delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function deleteAllNotifications(userId) {
  const { error } = await table().delete().eq("user_id", userId);
  if (error) throw error;
}

export async function saveNotificationPermission(userId, permission) {
  const { error } = await supabase.from(TABLES.PROFILES).update({ notification_permission: permission, updated_at: new Date().toISOString() }).eq("id", userId);
  if (error) throw error;
}

export async function getOrderForNotification(orderId, userId) {
  if (!orderId) return null;
  const { data, error } = await supabase.from(TABLES.ORDERS).select("*").eq("id", orderId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

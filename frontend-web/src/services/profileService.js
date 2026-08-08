import { supabase } from "../supabase/client.js";
import { BUCKETS, TABLES } from "../supabase/constants.js";
import { getPublicUrl, uploadFile } from "../supabase/storage.js";

export async function getProfile(userId) {
  const { data, error } = await supabase.from(TABLES.PROFILES).select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function ensureProfile(user) {
  const current = await getProfile(user.id);
  if (current) return current;
  const payload = { id: user.id, user_id: user.id, full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Pelanggan Dimsum", phone: user.user_metadata?.phone || null };
  const { data, error } = await supabase.from(TABLES.PROFILES).upsert(payload, { onConflict: "id" }).select().single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, payload) {
  const allowedFields = ["full_name", "phone", "avatar_url"];
  const safePayload = Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => allowedFields.includes(key) && value !== undefined)
  );
  const { data, error } = await supabase.from(TABLES.PROFILES).update({ ...safePayload, updated_at: new Date().toISOString() }).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}

export async function updateAccountEmail(email) {
  const { data, error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
  return data.user;
}

export async function updateAccountMetadata(metadata) {
  const { data, error } = await supabase.auth.updateUser({ data: metadata });
  if (error) throw error;
  return data.user;
}

export async function uploadProfileAvatar(userId, file) {
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  if (!extension) throw new Error("Format gambar tidak didukung.");
  const path = `${userId}/avatar.${extension}`;
  await uploadFile(BUCKETS.AVATARS, path, file);
  const avatarUrl = `${getPublicUrl(BUCKETS.AVATARS, path)}?v=${Date.now()}`;
  return updateProfile(userId, { avatar_url: avatarUrl });
}

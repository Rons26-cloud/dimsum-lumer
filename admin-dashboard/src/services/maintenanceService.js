import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";

export async function setMaintenance(target, isActive, message = "", schedule = {}) {
  const payload = {
    target,
    is_active: Boolean(isActive),
    message: String(message || "").trim(),
    start_time: schedule.start_time || null,
    end_time: schedule.end_time || null,
  };
  let { data, error } = await supabase
    .from(TABLES.MAINTENANCE)
    .upsert(payload, { onConflict: "target" })
    .select();
  // Beberapa project lama belum memiliki kolom jadwal. Status maintenance
  // tetap harus dapat disimpan agar Web dan APK tidak gagal total.
  if (error && /start_time|end_time|schema cache|column/i.test(error.message || "")) {
    const fallback = await supabase
      .from(TABLES.MAINTENANCE)
      .upsert({ target, is_active: Boolean(isActive), message: payload.message }, { onConflict: "target" })
      .select();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;
  return data;
}

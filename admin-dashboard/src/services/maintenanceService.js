import { supabase } from "../supabase/client.js";

export async function setMaintenance(target, isActive, message = "", schedule = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) throw new Error("Sesi admin tidak aktif. Silakan login ulang sebelum mengubah maintenance.");
  const payload = {
    target,
    is_active: Boolean(isActive),
    message: String(message || "").trim(),
    start_time: schedule.start_time || null,
    end_time: schedule.end_time || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.rpc("set_maintenance_mode", { p_payload: payload });
  if (error?.code === "PGRST202" || error?.code === "PGRST404" || /schema cache|could not find|not found/i.test(error?.message || "")) throw new Error("Fungsi maintenance belum terpasang di Supabase. Jalankan SUPABASE_MASTER_FIXED.sql lalu login ulang.");
  if (error) throw new Error(error.message || "Status maintenance gagal disimpan ke Supabase.");
  if (!data?.success) throw new Error(data?.message || "Supabase tidak mengonfirmasi perubahan maintenance.");
  const { data: saved, error: verifyError } = await supabase.rpc("get_maintenance_status", { p_target: target });
  if (verifyError) throw new Error(`Status tersimpan tetapi gagal diverifikasi: ${verifyError.message}`);
  if (!saved || Boolean(saved.configured_active) !== Boolean(isActive)) throw new Error("Status maintenance di Supabase tidak sesuai dengan pilihan admin.");
  return saved;
}

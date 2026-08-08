import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";

export async function setMaintenance(target, isActive, message = "") {
  const { data, error } = await supabase
    .from(TABLES.MAINTENANCE)
    .upsert({ target, is_active: isActive, message }, { onConflict: "target" })
    .select();
  if (error) throw error;
  return data;
}

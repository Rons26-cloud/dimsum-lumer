import { supabase } from "../supabase/client.js";

export async function getUserPaymentMethods() {
  const { data, error } = await supabase.from("user_payment_methods").select("*,profiles(id,full_name,email,phone,avatar_url)").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteUserPaymentMethod(id, reason) {
  const { data, error } = await supabase.rpc("admin_delete_user_payment_method", { target_method_id: id, deletion_reason: String(reason || "").trim() });
  if (error) throw error;
  return data;
}

export async function updateUserPaymentMethod(id, values, reason) {
  const { data, error } = await supabase.rpc("admin_update_user_payment_method", {
    target_method_id: id,
    new_type: values.type,
    new_provider: String(values.provider || "").trim(),
    new_account_name: String(values.account_name || "").trim(),
    new_account_number: String(values.account_number || "").replace(/[^0-9]/g, ""),
    new_label: String(values.label || "").trim(),
    new_is_primary: Boolean(values.is_primary),
    new_status: values.status,
    update_reason: String(reason || "").trim(),
  });
  if (error) throw error;
  return data;
}

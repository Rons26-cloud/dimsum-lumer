import { supabase } from "../supabase/client.js";
export async function getAvailableRewards() {
  let response = await supabase.from("rewards").select("*").eq("status", "aktif").order("point_required");
  if (response.error) response = await supabase.from("reward").select("*").eq("is_active", true).order("point_cost");
  if (response.error) throw response.error;
  return response.data || [];
}

export async function getRewardHistory(userId) {
  let response = await supabase.from("reward_history").select("*").eq("user_id", userId).order("created_at", { ascending:false });
  if (response.error) response = await supabase.from("reward_transactions").select("*").eq("user_id", userId).order("created_at", { ascending:false });
  if (response.error) return [];
  return response.data || [];
}

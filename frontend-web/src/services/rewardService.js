import { supabase } from "../supabase/client.js";
export async function getAvailableRewards() {
  let response = await supabase.from("rewards").select("*").eq("status", "aktif").order("is_featured", { ascending:false }).order("sort_order").order("point_required");
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

export async function redeemReward(rewardId) {
  const { data, error } = await supabase.rpc("redeem_member_reward", { p_reward_id: rewardId });
  if (error) throw error;
  return data;
}

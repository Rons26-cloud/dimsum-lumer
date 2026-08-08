import { supabase } from "../supabase/client.js";

export function memberLevel(point = 0) {
  if (point >= 7800) return "Platinum";
  if (point >= 5200) return "Gold";
  if (point >= 2600) return "Silver";
  return "Bronze";
}

export function memberProgress(point = 0) {
  const ranges = { Bronze:[0,2600], Silver:[2600,5200], Gold:[5200,7800], Platinum:[7800,7800] };
  const level = memberLevel(point); const [start,next]=ranges[level];
  const benefits = { Bronze:'Akses promo member', Silver:'Promo Silver lebih banyak', Gold:'Promo Gold prioritas', Platinum:'Promo eksklusif tertinggi' };
  return { level, start, next, percent:level==='Platinum'?100:Math.min(100,Math.max(0,((point-start)/(next-start))*100)), remaining:level==='Platinum'?0:next-point, benefit:benefits[level] };
}

export async function getMemberPoint(userId, profilePoint = null) {
  if (profilePoint !== null && profilePoint !== undefined) return Number(profilePoint || 0);
  const { data, error } = await supabase.from("profiles").select("point").eq("id", userId).maybeSingle();
  if (error) throw error;
  return Number(data?.point || 0);
}

export async function getPointHistory(userId) {
  const { data, error } = await supabase.from("point_history").select("*").eq("user_id", userId).order("created_at", { ascending:false });
  if (error) throw error;
  return data || [];
}

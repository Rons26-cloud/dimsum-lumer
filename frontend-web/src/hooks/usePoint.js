import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase/client.js";
import { getMemberPoint, memberProgress } from "../services/pointService.js";
import { getOrderStats } from "../services/orderService.js";
import { useAuth } from "./useAuth.js";

export function usePoint(profilePoint = null) {
  const { user }=useAuth();const [point,setPoint]=useState(0);const [orders,setOrders]=useState({total:0,pending:0,processing:0,shipping:0,completed:0,cancelled:0,latestOrder:null});const [loading,setLoading]=useState(true);
  const refresh=useCallback(async()=>{if(!user){setPoint(0);setLoading(false);return;}try{const [total,stats]=await Promise.all([getMemberPoint(user.id,profilePoint),getOrderStats(user.id)]);setPoint(total);setOrders(stats);}catch(error){console.error('Gagal memuat ringkasan member:',error.message);}finally{setLoading(false);}},[profilePoint,user]);
  useEffect(()=>{refresh();if(!user)return undefined;const suffix=crypto.randomUUID();const orderChannel=supabase.channel(`profile-orders-${suffix}`).on('postgres_changes',{event:'*',schema:'public',table:'orders',filter:`user_id=eq.${user.id}`},refresh).subscribe();return()=>{supabase.removeChannel(orderChannel);};},[refresh,user]);
  return { point, orders, progress:memberProgress(point), loading, refresh };
}

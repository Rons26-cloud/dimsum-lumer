import { useCallback, useEffect, useState } from "react";
import { getDashboardData, subscribeDashboard } from "../services/dashboardService.js";

const INITIAL = { stats: { totalOrders: 0, totalSales: 0, newCustomers: 0, productsSold: 0 }, salesChart: [], categories: [], bestSellers: [], productCatalog: [], orderStatuses: {}, recentOrders: [], storeInfo: {}, apkVersion: {}, apkStorage: { bytes: 0, files: 0 }, loading: true, refreshing: false, realtimeStatus: "CONNECTING", lastUpdated: null, error: "" };

export function useDashboardStats() {
  const [state, setState] = useState(INITIAL);
  const refresh = useCallback(async () => {
    try { setState((current) => ({ ...current, refreshing: !current.loading, error: "" })); const dashboard=await getDashboardData(); setState((current) => ({ ...current, ...dashboard, loading: false, refreshing: false, lastUpdated: new Date(), error: "" })); }
    catch (error) { setState((current) => ({ ...current, loading: false, refreshing: false, error: error.message || "Dashboard gagal dimuat." })); }
  }, []);
  useEffect(() => { let timer; refresh(); const unsubscribe=subscribeDashboard(()=>{clearTimeout(timer);timer=setTimeout(refresh,250);},(realtimeStatus)=>setState((current)=>({...current,realtimeStatus}))); return ()=>{clearTimeout(timer);unsubscribe();}; }, [refresh]);
  return { ...state, ...state.stats, refresh };
}

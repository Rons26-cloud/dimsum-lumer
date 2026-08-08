import MetricsGrid from "../../components/dashboard/MetricsGrid.jsx";
import InsightsGrid from "../../components/dashboard/InsightsGrid.jsx";
import { useDashboardStats } from "../../hooks/useDashboardStats.js";

export default function Statistics() {
  const data=useDashboardStats();
  return <div className="space-y-4"><div><h1 className="text-xl font-bold">Statistik</h1><p className="text-sm text-gray-500">Ringkasan performa toko berdasarkan data pesanan realtime.</p></div><MetricsGrid data={data}/><InsightsGrid bestSellers={data.bestSellers} categories={data.categories} statuses={data.orderStatuses||{}} totalOrders={data.totalOrders}/></div>;
}

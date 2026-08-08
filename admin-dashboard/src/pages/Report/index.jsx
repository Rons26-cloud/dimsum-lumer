import MetricsGrid from "../../components/dashboard/MetricsGrid.jsx";
import SalesChartCard from "../../components/dashboard/SalesChartCard.jsx";
import InsightsGrid from "../../components/dashboard/InsightsGrid.jsx";
import { useDashboardStats } from "../../hooks/useDashboardStats.js";
export default function ReportIndex(){const data=useDashboardStats();return <div className="space-y-4"><div><h1 className="text-xl font-bold">Laporan Penjualan</h1><p className="text-sm text-gray-500">Analitik mingguan yang diperbarui realtime.</p></div><MetricsGrid data={data}/><div className="grid grid-cols-1 gap-4 xl:grid-cols-3"><SalesChartCard data={data.salesChart}/></div><InsightsGrid bestSellers={data.bestSellers} categories={data.categories} statuses={data.orderStatuses||{}} totalOrders={data.totalOrders}/></div>;}

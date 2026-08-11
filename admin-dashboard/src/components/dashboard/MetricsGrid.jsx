import { PackageCheck, ShoppingCart, UserPlus, Wallet } from "lucide-react";
import StatCard from "../ui/StatCard.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";

export default function MetricsGrid({ data }) {
  return <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-4"><StatCard icon={<ShoppingCart size={20}/>} iconBg="bg-red-50 text-red-500" label="Pesanan Bulan Ini" value={data.totalOrders}/><StatCard icon={<Wallet size={20}/>} iconBg="bg-green-50 text-green-600" label="Penjualan Bulan Ini" value={formatCurrency(data.totalSales)}/><StatCard icon={<UserPlus size={20}/>} iconBg="bg-purple-50 text-purple-600" label="Pelanggan Baru Bulan Ini" value={data.newCustomers}/><StatCard icon={<PackageCheck size={20}/>} iconBg="bg-amber-50 text-amber-600" label="Produk Terjual Bulan Ini" value={data.productsSold}/></div>;
}

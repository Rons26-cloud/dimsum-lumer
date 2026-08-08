import { PackageCheck, ShoppingCart, UserPlus, Wallet } from "lucide-react";
import StatCard from "../ui/StatCard.jsx";

const rupiah = (value) => `Rp${Number(value || 0).toLocaleString("id-ID")}`;
export default function MetricsGrid({ data }) {
  return <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-4"><StatCard icon={<ShoppingCart size={20}/>} iconBg="bg-red-50 text-red-500" label="Total Pesanan" value={data.totalOrders}/><StatCard icon={<Wallet size={20}/>} iconBg="bg-green-50 text-green-600" label="Total Penjualan" value={rupiah(data.totalSales)}/><StatCard icon={<UserPlus size={20}/>} iconBg="bg-purple-50 text-purple-600" label="Pelanggan Baru" value={data.newCustomers}/><StatCard icon={<PackageCheck size={20}/>} iconBg="bg-amber-50 text-amber-600" label="Produk Terjual" value={data.productsSold}/></div>;
}

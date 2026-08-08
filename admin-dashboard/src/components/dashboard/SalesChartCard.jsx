import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "../ui/Card.jsx";

const rupiah = (value) => `Rp${Number(value || 0).toLocaleString("id-ID")}`;
export default function SalesChartCard({ data }) {
  return <Card title="Grafik Penjualan Mingguan" className="xl:col-span-2"><ResponsiveContainer width="100%" height={260}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#eee"/><XAxis dataKey="date"/><YAxis yAxisId="sales" tickFormatter={(value)=>`${value/1000}k`}/><YAxis yAxisId="orders" orientation="right" allowDecimals={false}/><Tooltip formatter={(value,name)=>name==="Penjualan"?rupiah(value):value}/><Line yAxisId="sales" type="monotone" dataKey="sales" name="Penjualan" stroke="#f97316" strokeWidth={3}/><Line yAxisId="orders" type="monotone" dataKey="orders" name="Pesanan" stroke="#64748b" strokeWidth={2}/></LineChart></ResponsiveContainer></Card>;
}

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { downloadCsv } from "../../utils/downloadCsv.js";
import Badge from "../ui/Badge.jsx";
import Card from "../ui/Card.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";

const STATUS={pending:"Menunggu Konfirmasi",processing:"Sedang Diproses",shipping:"Sedang Dikirim",completed:"Selesai",cancelled:"Dibatalkan"};
const rupiah = formatCurrency;
const total=(order)=>order.total_price??order.total_amount??order.total??0;

export default function RecentOrdersTable({ orders, saving, onStatusChange }) {
  const [filter,setFilter]=useState("all");
  const visible=useMemo(()=>filter==="all"?orders:orders.filter((order)=>order.status===filter),[filter,orders]);
  const exportCsv=()=>{
    const rows=[["Kode","Pelanggan","Total","Status","Tanggal"],...visible.map((order)=>[order.order_code||order.id,order.customer_name||"Pelanggan",total(order),STATUS[order.status]||order.status,order.created_at||""])];
    downloadCsv(rows, "pesanan-terbaru");
  };
  const actions=<div className="flex items-center gap-2"><select value={filter} onChange={(event)=>setFilter(event.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs"><option value="all">Semua status</option>{Object.entries(STATUS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={exportCsv} disabled={!visible.length} className="grid h-8 w-8 place-items-center rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40" aria-label="Ekspor pesanan CSV"><Download size={14}/></button></div>;
  return <Card title="Pesanan Terbaru" action={actions} className="xl:col-span-2">{visible.length?<div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-xs text-gray-400"><tr><th className="pb-3">Pesanan</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{visible.map((order)=><tr key={order.id} className="border-t"><td className="py-3 font-semibold">#{order.order_code||String(order.id).slice(0,8)}</td><td>{order.customer_name||"Pelanggan"}</td><td>{rupiah(total(order))}</td><td><Badge status={order.status}>{STATUS[order.status]||order.status}</Badge></td><td><select aria-label={`Ubah status ${order.order_code||order.id}`} disabled={saving} value={order.status} onChange={(event)=>onStatusChange(order.id,event.target.value)} className="rounded-lg border bg-white p-2 text-xs">{Object.entries(STATUS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></td></tr>)}</tbody></table></div>:<p className="py-8 text-center text-sm text-gray-400">Tidak ada pesanan pada filter ini.</p>}</Card>;
}

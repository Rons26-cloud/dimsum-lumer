import { useMemo, useState } from "react";
import {
  Activity, CalendarDays, ChevronLeft, ChevronRight, Clock3, Download,
  Eye, Filter, ReceiptText, RefreshCw, Search, ShoppingBag, TrendingUp, Wallet, X,
} from "lucide-react";
import {
  Area, Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { formatCompactCurrency, formatCurrency } from "../../utils/formatCurrency.js";
import { downloadCsv as saveCsv } from "../../utils/downloadCsv.js";

const STATUS = {
  pending: { label: "Menunggu", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  processing: { label: "Diproses", badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  shipping: { label: "Dikirim", badge: "bg-violet-50 text-violet-700 ring-violet-200" },
  completed: { label: "Selesai", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  cancelled: { label: "Dibatalkan", badge: "bg-rose-50 text-rose-700 ring-rose-200" },
};
const PRESETS = [
  { key: "today", label: "Hari ini", days: 1 }, { key: "week", label: "7 Hari", days: 7 },
  { key: "month", label: "30 Hari", days: 30 }, { key: "year", label: "Tahun ini", days: 0 },
  { key: "all", label: "Semua", days: null },
];

function normalizeStatus(value) {
  const status = String(value || "pending").toLowerCase();
  if (["selesai", "completed", "delivered", "success"].includes(status)) return "completed";
  if (["batal", "dibatalkan", "cancelled", "canceled", "failed"].includes(status)) return "cancelled";
  if (["dikirim", "shipped", "shipping", "delivery", "on_delivery"].includes(status)) return "shipping";
  if (["diproses", "processing", "confirmed", "paid"].includes(status)) return "processing";
  return "pending";
}
function total(order) { const amount = Number(order.total_price ?? order.total_amount ?? order.grand_total ?? order.total ?? 0); return Number.isFinite(amount) ? amount : 0; }
function dateOf(order) { const date = new Date(order.created_at || order.order_date || order.updated_at || 0); return Number.isNaN(date.getTime()) ? null : date; }
function codeOf(order) { return order.order_code || order.invoice_number || String(order.id || "").slice(0, 8).toUpperCase(); }
function customerOf(order) { return order.customer_name || order.recipient_name || order.name || order.shipping_name || "Pelanggan"; }
function startDate(preset) {
  const now = new Date();
  if (preset === "all") return null;
  if (preset === "year") return new Date(now.getFullYear(), 0, 1);
  const days = PRESETS.find((item) => item.key === preset)?.days || 1;
  const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - days + 1); return start;
}
function downloadCsv(rows) {
  const content = [["Kode", "Tanggal", "Jam", "Pelanggan", "Status", "Pembayaran", "Total"], ...rows.map((order) => {
    const date = dateOf(order); return [codeOf(order), date?.toLocaleDateString("id-ID") || "", date?.toLocaleTimeString("id-ID") || "", customerOf(order), STATUS[normalizeStatus(order.status)]?.label, order.payment_method || order.payment_type || "-", total(order)];
  })];
  return saveCsv(content, "laporan-penjualan");
}

function SummaryCard({ icon: Icon, title, value, note, color }) {
  return <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p><p className="mt-2 break-words text-xl font-extrabold text-gray-900 sm:text-2xl">{value}</p><p className="mt-2 text-xs text-gray-400">{note}</p></div><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${color}`}><Icon size={20}/></span></div></article>;
}
function StatusBadge({ status }) { const meta = STATUS[normalizeStatus(status)] || STATUS.pending; return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${meta.badge}`}>{meta.label}</span>; }

export default function ReportIndex() {
  const orders = useLiveCollection("orders", { order: { column: "created_at", ascending: false } });
  const [preset, setPreset] = useState("month");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 10;

  const report = useMemo(() => {
    const start = startDate(preset); const end = new Date();
    const periodRows = (orders || []).map((order) => ({ ...order, _date: dateOf(order), _total: total(order), _status: normalizeStatus(order.status) })).filter((order) => order._date && (!start || order._date >= start) && order._date <= end);
    const visible = periodRows.filter((order) => status === "all" || order._status === status).filter((order) => { const needle = query.toLowerCase().trim(); return !needle || `${codeOf(order)} ${customerOf(order)} ${order.phone || order.customer_phone || ""}`.toLowerCase().includes(needle); });
    const valid = visible.filter((order) => order._status !== "cancelled");
    const revenue = valid.reduce((sum, order) => sum + order._total, 0);
    const completed = visible.filter((order) => order._status === "completed");
    const byMonth = preset === "year" || preset === "all";
    const chartMap = new Map();
    visible.forEach((order) => {
      const key = byMonth ? `${order._date.getFullYear()}-${String(order._date.getMonth() + 1).padStart(2, "0")}` : order._date.toISOString().slice(0, 10);
      const item = chartMap.get(key) || { key, label: byMonth ? order._date.toLocaleDateString("id-ID", { month: "short", year: preset === "all" ? "2-digit" : undefined }) : order._date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }), revenue: 0, orders: 0 };
      item.orders += 1; if (order._status !== "cancelled") item.revenue += order._total; chartMap.set(key, item);
    });
    return { visible: visible.sort((a, b) => b._date - a._date), revenue, completed: completed.length, average: valid.length ? revenue / valid.length : 0, chart: [...chartMap.values()].sort((a, b) => a.key.localeCompare(b.key)), totalPeriod: periodRows.length };
  }, [orders, preset, status, query]);

  const totalPages = Math.max(1, Math.ceil(report.visible.length / pageSize));
  const paginated = report.visible.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize);
  const choosePreset = (key) => { setPreset(key); setPage(1); };
  const refresh = () => { setRefreshing(true); window.dispatchEvent(new CustomEvent("admin:refresh-data", { detail: { table: "orders" } })); window.setTimeout(() => setRefreshing(false), 800); };

  if (orders === null) return <div className="animate-pulse space-y-5"><div className="h-32 rounded-3xl bg-gray-100"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((i) => <div key={i} className="h-28 rounded-2xl bg-gray-100"/>)}</div><div className="h-96 rounded-2xl bg-gray-100"/></div>;

  return <div className="animate-fade-in space-y-5 sm:space-y-6">
    <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-xl sm:p-7"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-blue-300"><Activity size={15}/> Laporan realtime</div><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Laporan Penjualan</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Riwayat transaksi lengkap, grafik omzet, waktu transaksi, dan performa penjualan dalam satu halaman.</p></div><div className="flex flex-wrap gap-2"><button onClick={refresh} disabled={refreshing} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 text-xs font-bold hover:bg-white/15 disabled:opacity-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""}/>{refreshing ? "Memuat..." : "Refresh Live"}</button><button onClick={() => downloadCsv(report.visible)} disabled={!report.visible.length} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-500 px-4 text-xs font-bold shadow-lg shadow-blue-950/30 hover:bg-blue-400 disabled:opacity-40"><Download size={15}/>Ekspor CSV</button></div></div></header>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard icon={Wallet} title="Omzet bersih" value={formatCurrency(report.revenue)} note="Tidak termasuk transaksi batal" color="bg-orange-50 text-orange-600"/><SummaryCard icon={ReceiptText} title="Total transaksi" value={report.visible.length.toLocaleString("id-ID")} note={`${report.totalPeriod} transaksi pada periode`} color="bg-blue-50 text-blue-600"/><SummaryCard icon={TrendingUp} title="Rata-rata transaksi" value={formatCurrency(report.average)} note="Nilai rata-rata pesanan valid" color="bg-violet-50 text-violet-600"/><SummaryCard icon={ShoppingBag} title="Pesanan selesai" value={report.completed.toLocaleString("id-ID")} note={`${report.visible.length ? (report.completed / report.visible.length * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 }) : 0}% tingkat penyelesaian`} color="bg-emerald-50 text-emerald-600"/></div>

    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="font-bold text-gray-900">Grafik performa penjualan</h2><p className="mt-1 text-xs text-gray-400">Omzet Rupiah dan jumlah transaksi sesuai filter.</p></div><span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"/>REALTIME AKTIF</span></div><div className="h-80 min-w-0 sm:h-96"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={report.chart} margin={{ top: 10, right: 2, left: 0, bottom: 0 }}><defs><linearGradient id="reportFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={.35}/><stop offset="95%" stopColor="#2563eb" stopOpacity={.02}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#eef2f7" strokeDasharray="4 4"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} minTickGap={24}/><YAxis yAxisId="money" width={66} axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} tick={{ fontSize: 10, fill: "#94a3b8" }}/><YAxis yAxisId="count" orientation="right" width={25} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }}/><Tooltip contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 14, boxShadow: "0 8px 30px rgba(15,23,42,.1)" }} formatter={(value, name) => [name === "revenue" ? formatCurrency(value) : value, name === "revenue" ? "Omzet" : "Transaksi"]}/><Legend formatter={(value) => value === "revenue" ? "Omzet" : "Transaksi"}/><Area yAxisId="money" type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#reportFill)"/><Bar yAxisId="count" dataKey="orders" fill="#f97316" radius={[6,6,0,0]} maxBarSize={25}/></ComposedChart></ResponsiveContainer></div></section>

    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-2 text-sm font-bold text-gray-800"><Filter size={17} className="text-blue-600"/>Filter laporan</div><div className="mt-4 flex gap-2 overflow-x-auto pb-1">{PRESETS.map((item) => <button key={item.key} onClick={() => choosePreset(item.key)} className={`min-h-10 min-w-max rounded-xl border px-4 text-xs font-bold transition ${preset === item.key ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>{item.label}</button>)}</div><div className="mt-4 grid gap-3 md:grid-cols-[1fr_190px]"><label className="relative block"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17}/><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Cari kode, pelanggan, atau nomor telepon..." className="min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"/></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500"><option value="all">Semua status</option>{Object.entries(STATUS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></div></section>

    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="flex flex-col justify-between gap-2 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:p-5"><div><h2 className="font-bold text-gray-900">Riwayat transaksi</h2><p className="mt-1 text-xs text-gray-400">{report.visible.length} transaksi ditemukan · tanggal dan jam zona lokal</p></div><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500"><CalendarDays size={14}/>{new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</span></div>
      <div className="space-y-3 bg-gray-50/60 p-3 lg:hidden">{paginated.length ? paginated.map((order) => <article key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-extrabold text-gray-900">#{codeOf(order)}</p><p className="mt-1 truncate text-sm font-semibold text-gray-700">{customerOf(order)}</p></div><StatusBadge status={order._status}/></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3"><div><p className="text-[10px] uppercase text-gray-400">Tanggal transaksi</p><p className="mt-1 text-xs font-bold text-gray-700">{order._date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p></div><div><p className="text-[10px] uppercase text-gray-400">Jam transaksi</p><p className="mt-1 flex items-center gap-1 text-xs font-bold text-gray-700"><Clock3 size={13} className="text-blue-500"/>{order._date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p></div></div><div className="mt-4 flex items-center justify-between gap-3"><div><p className="text-[10px] text-gray-400">Total transaksi</p><p className="mt-1 text-base font-extrabold text-gray-900">{formatCurrency(order._total)}</p></div><button onClick={() => setSelected(order)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gray-900 px-3 text-xs font-bold text-white"><Eye size={14}/>Detail</button></div></article>) : <div className="py-14 text-center text-sm text-gray-400">Tidak ada transaksi pada filter ini.</div>}</div>
      <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400"><tr><th className="px-5 py-4">Transaksi</th><th className="px-4 py-4">Pelanggan</th><th className="px-4 py-4">Tanggal</th><th className="px-4 py-4">Jam</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Pembayaran</th><th className="px-4 py-4 text-right">Total</th><th className="px-5 py-4 text-right">Aksi</th></tr></thead><tbody>{paginated.map((order) => <tr key={order.id} className="border-t border-gray-50 hover:bg-blue-50/30"><td className="px-5 py-4 font-bold text-gray-900">#{codeOf(order)}</td><td className="px-4 py-4"><p className="font-semibold text-gray-700">{customerOf(order)}</p><p className="mt-0.5 text-[10px] text-gray-400">{order.customer_phone || order.phone || "Nomor tidak tersedia"}</p></td><td className="px-4 py-4 font-medium text-gray-600">{order._date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-gray-600"><Clock3 size={13} className="text-blue-500"/>{order._date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span></td><td className="px-4 py-4"><StatusBadge status={order._status}/></td><td className="px-4 py-4 text-xs font-medium text-gray-500">{order.payment_method || order.payment_type || "-"}</td><td className="px-4 py-4 text-right font-extrabold text-gray-900">{formatCurrency(order._total)}</td><td className="px-5 py-4 text-right"><button onClick={() => setSelected(order)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-900 hover:text-white" aria-label={`Detail ${codeOf(order)}`}><Eye size={15}/></button></td></tr>)}</tbody></table>{!paginated.length && <div className="py-16 text-center text-sm text-gray-400">Tidak ada transaksi pada filter ini.</div>}</div>
      {report.visible.length > pageSize && <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 p-4 sm:flex-row"><p className="text-xs text-gray-400">Halaman {Math.min(page, totalPages)} dari {totalPages}</p><div className="flex items-center gap-2"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="grid h-10 w-10 place-items-center rounded-xl border text-gray-600 disabled:opacity-30"><ChevronLeft size={17}/></button><span className="min-w-20 text-center text-xs font-bold text-gray-700">{Math.min(page, totalPages)} / {totalPages}</span><button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="grid h-10 w-10 place-items-center rounded-xl border text-gray-600 disabled:opacity-30"><ChevronRight size={17}/></button></div></div>}
    </section>

    {selected && <div className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-0 sm:place-items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><section className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Detail transaksi</p><h3 className="mt-1 text-xl font-extrabold text-gray-900">#{codeOf(selected)}</h3></div><button onClick={() => setSelected(null)} className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 text-gray-500"><X size={17}/></button></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-gray-50 p-3"><p className="text-[10px] text-gray-400">Tanggal</p><p className="mt-1 text-xs font-bold">{selected._date.toLocaleDateString("id-ID", { dateStyle: "long" })}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-[10px] text-gray-400">Jam</p><p className="mt-1 text-xs font-bold">{selected._date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p></div></div><dl className="mt-5 divide-y divide-gray-100 text-sm"><div className="flex justify-between gap-4 py-3"><dt className="text-gray-400">Pelanggan</dt><dd className="text-right font-bold text-gray-800">{customerOf(selected)}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-gray-400">Telepon</dt><dd className="text-right font-semibold text-gray-700">{selected.customer_phone || selected.phone || "-"}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-gray-400">Pembayaran</dt><dd className="text-right font-semibold text-gray-700">{selected.payment_method || selected.payment_type || "-"}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-gray-400">Status</dt><dd><StatusBadge status={selected._status}/></dd></div><div className="flex justify-between gap-4 py-4"><dt className="font-semibold text-gray-600">Total transaksi</dt><dd className="text-lg font-extrabold text-gray-900">{formatCurrency(selected._total)}</dd></div></dl></section></div>}
  </div>;
}

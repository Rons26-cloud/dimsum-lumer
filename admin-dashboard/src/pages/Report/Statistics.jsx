import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, BarChart3, CalendarDays, CheckCircle2, Clock3,
  Eye, PackageCheck, ReceiptText, RefreshCw, TrendingDown, TrendingUp, Wallet, X,
} from "lucide-react";
import {
  Area, Bar, CartesianGrid, ComposedChart, Legend, ResponsiveContainer,
  ReferenceLine, Tooltip, XAxis, YAxis,
} from "recharts";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { TABLES } from "../../supabase/constants.js";
import { formatCompactCurrency, formatCurrency } from "../../utils/formatCurrency.js";

const DAY = 86_400_000;
const PERIODS = {
  hour: { label: "Per Jam", short: "Jam", count: 24 },
  day: { label: "Harian", short: "Hari", count: 7 },
  week: { label: "Mingguan", short: "Minggu", count: 12 },
  month: { label: "Bulanan", short: "Bulan", count: 12 },
  year: { label: "Tahunan", short: "Bulan", count: 12 },
};

const STATUS_META = {
  pending: { label: "Menunggu", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  processing: { label: "Diproses", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
  shipped: { label: "Dikirim", color: "bg-violet-500", text: "text-violet-700", bg: "bg-violet-50" },
  completed: { label: "Selesai", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  cancelled: { label: "Dibatalkan", color: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
};

function normalizeStatus(value) {
  const status = String(value || "pending").toLowerCase().trim();
  if (["selesai", "completed", "complete", "delivered", "success"].includes(status)) return "completed";
  if (["batal", "dibatalkan", "cancelled", "canceled", "failed"].includes(status)) return "cancelled";
  if (["dikirim", "shipped", "delivery", "on_delivery"].includes(status)) return "shipped";
  if (["diproses", "processing", "process", "confirmed", "paid"].includes(status)) return "processing";
  return "pending";
}

function orderDate(order) {
  const value = order.created_at || order.order_date || order.date || order.updated_at;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function orderTotal(order) {
  const value = Number(order.total_price ?? order.total_amount ?? order.grand_total ?? order.total ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function startOf(date, period) {
  const next = new Date(date);
  if (period === "hour") next.setMinutes(0, 0, 0);
  if (period === "day") next.setHours(0, 0, 0, 0);
  if (period === "week") {
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() - ((next.getDay() + 6) % 7));
  }
  if (period === "month") next.setFullYear(next.getFullYear(), next.getMonth(), 1), next.setHours(0, 0, 0, 0);
  if (period === "year") next.setFullYear(next.getFullYear(), 0, 1), next.setHours(0, 0, 0, 0);
  return next;
}

function shift(date, period, amount) {
  const next = new Date(date);
  if (period === "hour") next.setHours(next.getHours() + amount);
  if (period === "day") next.setDate(next.getDate() + amount);
  if (period === "week") next.setDate(next.getDate() + amount * 7);
  if (period === "month") next.setMonth(next.getMonth() + amount);
  if (period === "year") next.setFullYear(next.getFullYear() + amount);
  return next;
}

function bucketLabel(date, period, full = false) {
  const locale = "id-ID";
  if (period === "hour") return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  if (period === "day") return date.toLocaleDateString(locale, full ? { weekday: "long", day: "2-digit", month: "short" } : { day: "2-digit", month: "short" });
  if (period === "week") return `${full ? "Minggu mulai " : "Min "}${date.toLocaleDateString(locale, { day: "2-digit", month: "short" })}`;
  if (period === "month") return date.toLocaleDateString(locale, { month: full ? "long" : "short", year: "numeric" });
  return String(date.getFullYear());
}

function growth(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function MetricCard({ icon: Icon, label, value, note, change, tone = "orange" }) {
  const tones = {
    orange: "bg-orange-50 text-orange-600", blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600",
  };
  return <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p><p className="mt-2 break-words text-xl font-bold text-gray-900 sm:text-2xl">{value}</p></div>
      <span className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon size={20}/></span>
    </div>
    <div className="mt-3 flex items-center gap-1.5 text-xs">
      {typeof change === "number" && <span className={`inline-flex items-center gap-1 font-semibold ${change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
        {change >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {Math.abs(change).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
      </span>}
      <span className="text-gray-400">{note}</span>
    </div>
  </div>;
}

export default function Statistics() {
  const [period, setPeriod] = useState("day");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());
  const [selectedBucketKey, setSelectedBucketKey] = useState(null);
  const chartSectionRef = useRef(null);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [baseYear, setBaseYear] = useState(() => new Date().getFullYear());
  const orders = useLiveCollection("orders", { order: { column: "created_at", ascending: false } });
  const orderItems = useLiveCollection(TABLES.ORDER_ITEMS);
  const orderDetails = useLiveCollection(TABLES.ORDER_DETAIL);
  const items = useMemo(() => [...(orderItems || []), ...(orderDetails || [])], [orderItems, orderDetails]);
  const loading = orders === null || orderItems === null || orderDetails === null;

  useEffect(() => {
    const timer = window.setInterval(() => {
      const yearNow = new Date().getFullYear();
      setBaseYear((previousYear) => {
        if (previousYear !== yearNow) setSelectedYear((year) => year === previousYear ? yearNow : year);
        return yearNow;
      });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const yearOptions = useMemo(() => Array.from({ length: 51 }, (_, index) => baseYear + index), [baseYear]);

  useEffect(() => setSelectedBucketKey(null), [period, selectedYear]);

  const refreshStatistics = () => {
    if (refreshing) return;
    setRefreshing(true);
    ["orders", "order_items", "order_detail"].forEach((table) => {
      window.dispatchEvent(new CustomEvent("admin:refresh-data", { detail: { table } }));
    });
    window.setTimeout(() => {
      setLastRefreshed(new Date());
      setRefreshing(false);
    }, 800);
  };

  const analytics = useMemo(() => {
    const config = PERIODS[period];
    const bucketPeriod = period === "year" ? "month" : period;
    const currentStart = period === "year" ? new Date(selectedYear, 0, 1) : startOf(new Date(), period);
    const starts = period === "year"
      ? Array.from({ length: 12 }, (_, index) => new Date(selectedYear, index, 1))
      : Array.from({ length: config.count }, (_, index) => shift(currentStart, period, index - config.count + 1));
    const buckets = starts.map((start) => ({ start, end: shift(start, bucketPeriod, 1), label: bucketLabel(start, bucketPeriod), fullLabel: bucketLabel(start, bucketPeriod, true) }));
    const rangeStart = starts[0];
    const rangeEnd = shift(starts[starts.length - 1], bucketPeriod, 1);
    const previousStart = shift(rangeStart, bucketPeriod, -config.count);
    const mapped = (orders || []).map((order) => ({ ...order, _date: orderDate(order), _status: normalizeStatus(order.status || order.order_status), _total: orderTotal(order) })).filter((order) => order._date);
    const currentOrders = mapped.filter((order) => order._date >= rangeStart && order._date < rangeEnd);
    const previousOrders = mapped.filter((order) => order._date >= previousStart && order._date < rangeStart);
    const valid = currentOrders.filter((order) => order._status !== "cancelled");
    const previousValid = previousOrders.filter((order) => order._status !== "cancelled");
    const revenue = valid.reduce((sum, order) => sum + order._total, 0);
    const previousRevenue = previousValid.reduce((sum, order) => sum + order._total, 0);
    const validIds = new Set(valid.map((order) => String(order.id)));
    const soldItems = items.filter((item) => validIds.has(String(item.order_id || item.pesanan_id))).reduce((sum, item) => sum + Number(item.quantity ?? item.qty ?? item.jumlah ?? 1), 0);
    const chart = buckets.map((bucket) => {
      const rows = currentOrders.filter((order) => order._date >= bucket.start && order._date < bucket.end);
      const validRows = rows.filter((order) => order._status !== "cancelled");
      const bucketRevenue = validRows.reduce((sum, order) => sum + order._total, 0);
      return { ...bucket, rows, orders: rows.length, revenue: bucketRevenue, average: validRows.length ? bucketRevenue / validRows.length : 0 };
    });
    const statuses = Object.keys(STATUS_META).map((key) => ({ key, count: currentOrders.filter((order) => order._status === key).length }));
    return {
      chart, statuses, totalOrders: currentOrders.length, revenue, soldItems,
      average: valid.length ? revenue / valid.length : 0,
      completed: statuses.find((item) => item.key === "completed")?.count || 0,
      completionRate: currentOrders.length ? ((statuses.find((item) => item.key === "completed")?.count || 0) / currentOrders.length) * 100 : 0,
      revenueGrowth: growth(revenue, previousRevenue), orderGrowth: growth(currentOrders.length, previousOrders.length),
      peak: chart.reduce((best, item) => item.revenue > (best?.revenue || 0) ? item : best, null),
      rangeLabel: period === "year" ? `Januari – Desember ${selectedYear}` : `${bucketLabel(rangeStart, period, true)} – ${bucketLabel(new Date(rangeEnd.getTime() - 1), period, true)}`,
    };
  }, [orders, items, period, selectedYear]);

  const selectedBucket = useMemo(
    () => analytics.chart.find((item) => item.start.toISOString() === selectedBucketKey) || null,
    [analytics.chart, selectedBucketKey],
  );

  const openBucketHistory = (row) => {
    if (!row.orders) return;
    setSelectedBucketKey(row.start.toISOString());
    window.setTimeout(() => chartSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  };

  if (loading) return <div className="space-y-5 animate-pulse"><div className="h-24 rounded-2xl bg-gray-100"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((i)=><div key={i} className="h-32 rounded-2xl bg-gray-100"/>)}</div><div className="h-96 rounded-2xl bg-gray-100"/></div>;

  return <div className="animate-fade-in space-y-5 sm:space-y-6">
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 p-5 text-white shadow-lg sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-orange-300"><Activity size={15}/> Analitik realtime</div><h1 className="text-2xl font-bold sm:text-3xl">Statistika Penjualan</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">Pantau omzet, pesanan, produk terjual, serta performa transaksi berdasarkan rentang waktu yang dipilih ya sayang.</p></div>
        <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"><div className="flex items-center gap-2 text-sm font-semibold"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"/></span> Terhubung realtime</div><p className="mt-1 text-xs text-gray-300">{analytics.rangeLabel}</p></div>
      </div>
    </section>

    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
      {Object.entries(PERIODS).map(([key, item]) => <button key={key} onClick={() => setPeriod(key)} aria-pressed={period === key} className={`min-w-max rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${period === key ? "border-orange-700 bg-orange-500 text-white shadow-md shadow-orange-200" : "border-transparent bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"}`}><span className={period === key ? "text-white" : "text-inherit"}>{item.label}</span>{period === key && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-white"/>}</button>)}
    </div>

    {period === "year" && <section className="min-w-0 overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/60 p-4 sm:p-5">
      <div className="flex min-w-0 flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0"><p className="text-sm font-bold text-gray-900">Tahun laporan</p><p className="mt-1 max-w-xl text-xs leading-5 text-gray-500">Grafik menampilkan Januari–Desember. Tahun berjalan dipilih otomatis.</p></div>
        <label className="grid w-full min-w-0 grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2 text-xs font-semibold text-gray-600 md:w-auto md:grid-cols-[auto_auto_auto]"><CalendarDays size={16} className="shrink-0 text-orange-600"/><span className="whitespace-nowrap">Pilih tahun</span><select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} className="col-span-2 block w-full min-w-0 max-w-full rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 md:col-span-1 md:w-28">{yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
      </div>
    </section>}

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard icon={Wallet} label="Omzet valid" value={formatCurrency(analytics.revenue)} change={analytics.revenueGrowth} note="dibanding periode lalu"/>
      <MetricCard icon={ReceiptText} label="Total pesanan" value={analytics.totalOrders.toLocaleString("id-ID")} change={analytics.orderGrowth} note="dibanding periode lalu" tone="blue"/>
      <MetricCard icon={BarChart3} label="Rata-rata transaksi" value={formatCurrency(analytics.average)} note="per pesanan valid" tone="violet"/>
      <MetricCard icon={PackageCheck} label="Produk terjual" value={analytics.soldItems.toLocaleString("id-ID")} note="dari pesanan valid" tone="green"/>
    </div>

    <section ref={chartSectionRef} className="scroll-mt-20 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-bold text-gray-900">Tren omzet dan pesanan</h2><p className="mt-1 text-xs text-gray-400">Diperbarui otomatis saat data pesanan berubah di Supabase.</p></div><div className="flex items-center gap-2"><span className="hidden text-[10px] text-gray-400 sm:inline">Terakhir {lastRefreshed.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span><button type="button" onClick={refreshStatistics} disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 active:scale-95 disabled:cursor-wait disabled:opacity-60" aria-label="Refresh data statistik dari Supabase"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/>{refreshing ? "Memuat..." : "Refresh Live"}</button></div></div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={analytics.chart} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.35}/><stop offset="95%" stopColor="#f97316" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} minTickGap={20}/><YAxis yAxisId="money" tickFormatter={formatCompactCurrency} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={65}/><YAxis yAxisId="orders" orientation="right" allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28}/><Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #f1f5f9", boxShadow: "0 8px 24px rgba(15,23,42,.08)" }} formatter={(value, name) => [name === "revenue" ? formatCurrency(value) : Number(value).toLocaleString("id-ID"), name === "revenue" ? "Omzet" : "Pesanan"]}/><Legend formatter={(value) => value === "revenue" ? "Omzet" : "Pesanan"}/>{selectedBucket && <ReferenceLine yAxisId="money" x={selectedBucket.label} stroke="#111827" strokeWidth={2} strokeDasharray="5 4" label={{ value: "Dipilih", position: "insideTopRight", fill: "#111827", fontSize: 10 }}/>}<Area yAxisId="money" type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fill="url(#salesFill)" isAnimationActive/><Bar yAxisId="orders" dataKey="orders" fill="#2563eb" radius={[5,5,0,0]} maxBarSize={22} isAnimationActive/></ComposedChart></ResponsiveContainer>
      </div>
      {selectedBucket && <div className="mt-5 overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/50"><div className="flex items-center justify-between gap-3 border-b border-orange-100 p-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-orange-600">History periode dipilih</p><h3 className="mt-1 font-bold text-gray-900">{selectedBucket.fullLabel}</h3></div><button type="button" onClick={() => setSelectedBucketKey(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-gray-500 shadow-sm hover:text-gray-900" aria-label="Tutup history"><X size={16}/></button></div><div className="grid grid-cols-3 gap-2 p-4 text-center"><div className="rounded-xl bg-white p-3"><p className="text-[10px] text-gray-400">Pesanan</p><strong className="mt-1 block text-sm text-gray-900">{selectedBucket.orders}</strong></div><div className="rounded-xl bg-white p-3"><p className="text-[10px] text-gray-400">Omzet</p><strong className="mt-1 block text-xs text-gray-900 sm:text-sm">{formatCurrency(selectedBucket.revenue)}</strong></div><div className="rounded-xl bg-white p-3"><p className="text-[10px] text-gray-400">Rata-rata</p><strong className="mt-1 block text-xs text-gray-900 sm:text-sm">{formatCurrency(selectedBucket.average)}</strong></div></div><div className="max-h-64 overflow-y-auto border-t border-orange-100 bg-white">{selectedBucket.rows.map((order) => <div key={order.id} className="flex items-center justify-between gap-3 border-b border-gray-50 px-4 py-3 last:border-0"><div className="min-w-0"><p className="truncate text-xs font-bold text-gray-800">#{order.order_code || order.invoice_number || String(order.id).slice(0, 8)}</p><p className="mt-1 text-[10px] text-gray-400">{order._date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} · {STATUS_META[order._status]?.label}</p></div><strong className="shrink-0 text-xs text-gray-900">{formatCurrency(order._total)}</strong></div>)}</div></div>}
    </section>

    <div className="grid gap-5 xl:grid-cols-3">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2"><div className="mb-4"><h2 className="font-bold text-gray-900">Rincian per {PERIODS[period].short.toLowerCase()}</h2><p className="mt-1 text-xs text-gray-400">Tekan periode yang memiliki pesanan untuk melihat history dan menyorot grafik.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400"><th className="px-3 py-3 font-semibold">Periode</th><th className="px-3 py-3 text-right font-semibold">Pesanan</th><th className="px-3 py-3 text-right font-semibold">Omzet</th><th className="px-3 py-3 text-right font-semibold">Rata-rata</th><th className="px-3 py-3 text-right font-semibold">History</th></tr></thead><tbody>{[...analytics.chart].reverse().map((row) => { const available = row.orders > 0; const active = row.start.toISOString() === selectedBucketKey; return <tr key={row.start.toISOString()} onClick={() => openBucketHistory(row)} className={`border-b border-gray-50 last:border-0 ${available ? "cursor-pointer hover:bg-orange-50" : "cursor-not-allowed opacity-50"} ${active ? "bg-orange-50 ring-1 ring-inset ring-orange-200" : ""}`}><td className="px-3 py-3 font-medium text-gray-700">{row.fullLabel}</td><td className="px-3 py-3 text-right text-gray-600">{row.orders.toLocaleString("id-ID")}</td><td className="px-3 py-3 text-right font-semibold text-gray-900">{formatCurrency(row.revenue)}</td><td className="px-3 py-3 text-right text-gray-500">{formatCurrency(row.average)}</td><td className="px-3 py-3 text-right"><button type="button" disabled={!available} onClick={(event) => { event.stopPropagation(); openBucketHistory(row); }} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold ${available ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : "bg-gray-100 text-gray-400"}`}><Eye size={13}/>{available ? "Lihat" : "Kosong"}</button></td></tr>})}</tbody></table></div></section>
      <div className="space-y-5">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">Status pesanan</h2><p className="mt-1 text-xs text-gray-400">Distribusi pada periode aktif</p><div className="mt-5 space-y-4">{analytics.statuses.map((item) => { const meta = STATUS_META[item.key]; const percentage = analytics.totalOrders ? item.count / analytics.totalOrders * 100 : 0; return <div key={item.key}><div className="mb-1.5 flex justify-between text-sm"><span className={`font-medium ${meta.text}`}>{meta.label}</span><span className="font-semibold text-gray-700">{item.count} <span className="font-normal text-gray-400">({percentage.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${meta.color}`} style={{ width: `${percentage}%` }}/></div></div>})}</div></section>
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">Sorotan performa</h2><div className="mt-4 space-y-3"><div className="flex gap-3 rounded-xl bg-emerald-50 p-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19}/><div><p className="text-sm font-semibold text-emerald-800">Tingkat selesai {analytics.completionRate.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</p><p className="mt-0.5 text-xs text-emerald-600">{analytics.completed} pesanan berhasil diselesaikan.</p></div></div><div className="flex gap-3 rounded-xl bg-orange-50 p-3"><CalendarDays className="mt-0.5 shrink-0 text-orange-600" size={19}/><div><p className="text-sm font-semibold text-orange-800">Periode omzet tertinggi</p><p className="mt-0.5 text-xs text-orange-600">{analytics.peak?.fullLabel || "Belum ada data"} · {formatCurrency(analytics.peak?.revenue || 0)}</p></div></div><div className="flex gap-3 rounded-xl bg-blue-50 p-3"><Clock3 className="mt-0.5 shrink-0 text-blue-600" size={19}/><div><p className="text-sm font-semibold text-blue-800">Data tersinkron otomatis</p><p className="mt-0.5 text-xs text-blue-600">Tidak perlu memuat ulang halaman.</p></div></div></div></section>
      </div>
    </div>
  </div>;
}

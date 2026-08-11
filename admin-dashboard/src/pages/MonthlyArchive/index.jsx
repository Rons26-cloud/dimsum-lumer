import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Building2, CalendarDays, CircleDollarSign, Download, Gauge, Loader2, PackageCheck, Receipt, RefreshCw, Target, TrendingDown, TrendingUp, Users, Wifi, WifiOff } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "../../supabase/client.js";
import { formatCurrency } from "../../utils/formatCurrency.js";

const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const initialStats = { total_orders: 0, total_sales: 0, new_customers: 0, products_sold: 0, cost_of_goods: 0, gross_profit: 0, total_expenses: 0, net_profit: 0 };
const periodNames = { day: "Harian", month: "Bulanan", year: "Tahunan" };

function Metric({ icon: Icon, label, value, tone = "slate", money = false }) {
  const colors = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700", violet: "bg-violet-50 text-violet-700", slate: "bg-slate-100 text-slate-700" };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}><Icon size={18}/></span><p className="mt-3 text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><strong className="mt-1 block truncate text-lg text-slate-950">{money ? formatCurrency(value) : Number(value || 0).toLocaleString("id-ID")}</strong></div>;
}

function CircleStat({ label, value, color, track, caption }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
  return <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center"><div className="relative grid h-20 w-20 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${safeValue * 3.6}deg, ${track} 0deg)` }}><span className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-extrabold text-slate-900 shadow-inner">{Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</span></div><strong className="mt-2 text-[10px] text-slate-800">{label}</strong><span className="mt-0.5 text-[8px] leading-3 text-slate-400">{caption}</span></div>;
}

function escapeXml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export default function MonthlyArchive() {
  const [period, setPeriod] = useState("month");
  const [referenceDate, setReferenceDate] = useState(localDate());
  const [stats, setStats] = useState(initialStats);
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState("CONNECTING");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const load = useCallback(async () => {
    setError("");
    const [statsResult, archiveResult] = await Promise.all([
      supabase.rpc("get_financial_archive_statistics", { p_period: period, p_reference: referenceDate }),
      supabase.from("monthly_financial_archives").select("*").order("month_start", { ascending: false }),
    ]);
    if (statsResult.error) throw statsResult.error;
    if (archiveResult.error) throw archiveResult.error;
    setStats({ ...initialStats, ...(statsResult.data || {}) });
    setArchives(archiveResult.data || []);
    setLastSyncedAt(new Date());
  }, [period, referenceDate]);

  useEffect(() => {
    setLoading(true);
    load().catch((reason) => setError(reason.message || "Arsip gagal dimuat.")).finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const channel = supabase.channel("financial-archive-readonly").on("postgres_changes", { event: "*", schema: "public", table: "monthly_financial_archives" }, () => load().catch((reason) => setError(reason.message))).subscribe(setRealtimeStatus);
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const title = useMemo(() => {
    const date = new Date(`${referenceDate}T00:00:00`);
    if (period === "day") return date.toLocaleDateString("id-ID", { dateStyle: "long" });
    if (period === "year") return String(date.getFullYear());
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }, [period, referenceDate]);

  const management = useMemo(() => {
    const sales = Number(stats.total_sales || 0);
    const orders = Number(stats.total_orders || 0);
    return {
      grossMargin: sales > 0 ? Number(stats.gross_profit || 0) / sales * 100 : 0,
      netMargin: sales > 0 ? Number(stats.net_profit || 0) / sales * 100 : 0,
      expenseRatio: sales > 0 ? Number(stats.total_expenses || 0) / sales * 100 : 0,
      averageOrder: orders > 0 ? sales / orders : 0,
    };
  }, [stats]);

  const trendData = useMemo(() => archives.slice(0, 12).reverse().map((row) => ({
    month: new Date(`${row.month_start}T00:00:00`).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
    Penjualan: Number(row.total_sales || 0),
    "Laba Kotor": Number(row.gross_profit || 0),
    "Laba Bersih": Number(row.net_profit || 0),
  })), [archives]);

  const latestChange = useMemo(() => {
    if (archives.length < 2) return null;
    const current = Number(archives[0].total_sales || 0);
    const previous = Number(archives[1].total_sales || 0);
    return previous > 0 ? (current - previous) / previous * 100 : null;
  }, [archives]);

  const downloadExcel = () => {
    const metrics = [
      ["Total Pesanan", stats.total_orders, "count"], ["Total Penjualan", stats.total_sales, "money"],
      ["Pelanggan Baru", stats.new_customers, "count"], ["Produk Terjual", stats.products_sold, "count"],
      ["Modal / HPP", stats.cost_of_goods, "money"], ["Laba Kotor", stats.gross_profit, "money"],
      ["Pengeluaran", stats.total_expenses, "money"], ["Laba Bersih", stats.net_profit, "net"],
    ];
    const rows = metrics.map(([label, value, type]) => `<Row ss:Height="24"><Cell ss:StyleID="Label"><Data ss:Type="String">${escapeXml(label)}</Data></Cell><Cell ss:StyleID="${type === "count" ? "Count" : type === "net" && Number(value) < 0 ? "Negative" : type === "net" ? "Positive" : "Money"}"><Data ss:Type="Number">${Number(value || 0)}</Data></Cell></Row>`).join("");
    const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Arsip Keuangan Dimsum Lumer</Title><Author>Dashboard Dimsum Lumer</Author><Created>${new Date().toISOString()}</Created></DocumentProperties><Styles><Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/></Style><Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="18" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/></Style><Style ss:ID="Subtitle"><Alignment ss:Horizontal="Center"/><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#475569"/></Style><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2563EB" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1D4ED8"/></Borders></Style><Style ss:ID="Label"><Font ss:Bold="1" ss:Color="#334155"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style><Style ss:ID="Count"><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style><Style ss:ID="Money"><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="&quot;Rp&quot; #,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style><Style ss:ID="Positive"><Alignment ss:Horizontal="Right"/><Font ss:Bold="1" ss:Color="#047857"/><Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/><NumberFormat ss:Format="&quot;Rp&quot; #,##0"/></Style><Style ss:ID="Negative"><Alignment ss:Horizontal="Right"/><Font ss:Bold="1" ss:Color="#B91C1C"/><Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/><NumberFormat ss:Format="&quot;Rp&quot; #,##0;[Red]-&quot;Rp&quot; #,##0"/></Style></Styles><Worksheet ss:Name="Ringkasan Keuangan"><Table><Column ss:Width="210"/><Column ss:Width="170"/><Row ss:Height="38"><Cell ss:MergeAcross="1" ss:StyleID="Title"><Data ss:Type="String">ARSIP KEUANGAN DIMSUM LUMER</Data></Cell></Row><Row ss:Height="23"><Cell ss:MergeAcross="1" ss:StyleID="Subtitle"><Data ss:Type="String">${escapeXml(`${periodNames[period]} · ${title}`)}</Data></Cell></Row><Row ss:Height="20"><Cell ss:MergeAcross="1" ss:StyleID="Subtitle"><Data ss:Type="String">Diekspor ${escapeXml(new Date().toLocaleString("id-ID"))}</Data></Cell></Row><Row ss:Height="10"/><Row ss:Height="26"><Cell ss:StyleID="Header"><Data ss:Type="String">Keterangan</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Nilai</Data></Cell></Row>${rows}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>5</SplitHorizontal><TopRowBottomPane>5</TopRowBottomPane><ProtectObjects>False</ProtectObjects><ProtectScenarios>False</ProtectScenarios></WorksheetOptions></Worksheet></Workbook>`;
    const url = URL.createObjectURL(new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `arsip-keuangan-${period}-${referenceDate}.xls`; document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
  };

  return <div className="space-y-5">
    <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white shadow-xl sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-blue-300"><Archive size={14}/>Arsip Keuangan Baca-Saja</p><h1 className="mt-2 text-2xl font-extrabold">Statistik {periodNames[period]}</h1><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">Dihitung otomatis dari data utama dashboard dan Supabase. Arsip tidak dapat diedit atau dihapus.</p><div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${realtimeStatus === "SUBSCRIBED" ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>{realtimeStatus === "SUBSCRIBED" ? <Wifi size={11}/> : <WifiOff size={11}/>}Realtime {realtimeStatus === "SUBSCRIBED" ? "aktif" : "menghubungkan"}</span>{lastSyncedAt && <span className="rounded-full bg-white/10 px-2.5 py-1 text-slate-300">Sinkron {lastSyncedAt.toLocaleTimeString("id-ID")}</span>}</div></div><div className="flex flex-wrap gap-2"><button onClick={() => load().catch((reason) => setError(reason.message))} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-bold hover:bg-white/20"><RefreshCw size={14}/>Perbarui</button><button onClick={downloadExcel} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold shadow-lg shadow-emerald-950/30"><Download size={14}/>Unduh untuk Excel</button></div></div>
    </header>

    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_2fr]">
      <label className="text-[10px] font-bold uppercase text-slate-500">Jenis statistik<select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"><option value="day">Harian</option><option value="month">Bulanan</option><option value="year">Tahunan</option></select></label>
      <label className="text-[10px] font-bold uppercase text-slate-500">Tanggal acuan<input type="date" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold"/></label>
      <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Periode ditampilkan</p><strong className="mt-1 block text-sm capitalize text-slate-900">{title}</strong></div>
    </section>

    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
    {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-primary" size={28}/></div> : <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Receipt} label="Total pesanan" value={stats.total_orders} tone="blue"/><Metric icon={CircleDollarSign} label="Total penjualan" value={stats.total_sales} tone="emerald" money/><Metric icon={Users} label="Pelanggan baru" value={stats.new_customers} tone="violet"/><Metric icon={PackageCheck} label="Produk terjual" value={stats.products_sold} tone="amber"/><Metric icon={TrendingDown} label="Modal / HPP" value={stats.cost_of_goods} tone="amber" money/><Metric icon={TrendingUp} label="Laba kotor" value={stats.gross_profit} tone="emerald" money/><Metric icon={TrendingDown} label="Pengeluaran" value={stats.total_expenses} tone="red" money/><Metric icon={CircleDollarSign} label="Laba bersih" value={stats.net_profit} tone={Number(stats.net_profit) >= 0 ? "emerald" : "red"} money/></section>
      <section className="grid gap-4 xl:grid-cols-[.85fr_1.65fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] text-blue-600"><Building2 size={13}/>Ringkasan Eksekutif</p><h2 className="mt-1 text-sm font-extrabold text-slate-950">Indikator Kinerja Keuangan</h2></div><div className="grid grid-cols-2 gap-px bg-slate-200"><div className="bg-white p-4"><Gauge size={17} className="text-emerald-600"/><p className="mt-3 text-[9px] font-bold uppercase text-slate-400">Margin laba kotor</p><strong className="mt-1 block text-xl text-slate-950">{management.grossMargin.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</strong></div><div className="bg-white p-4"><Target size={17} className="text-blue-600"/><p className="mt-3 text-[9px] font-bold uppercase text-slate-400">Margin laba bersih</p><strong className={`mt-1 block text-xl ${management.netMargin >= 0 ? "text-emerald-700" : "text-red-600"}`}>{management.netMargin.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</strong></div><div className="bg-white p-4"><Receipt size={17} className="text-violet-600"/><p className="mt-3 text-[9px] font-bold uppercase text-slate-400">Rata-rata per pesanan</p><strong className="mt-1 block text-base text-slate-950">{formatCurrency(management.averageOrder)}</strong></div><div className="bg-white p-4"><TrendingDown size={17} className="text-red-500"/><p className="mt-3 text-[9px] font-bold uppercase text-slate-400">Rasio pengeluaran</p><strong className="mt-1 block text-xl text-slate-950">{management.expenseRatio.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</strong></div></div><div className="border-t border-slate-100 bg-slate-50 p-4"><p className="text-[9px] font-bold uppercase text-slate-400">Perubahan penjualan bulan terbaru</p>{latestChange === null ? <p className="mt-1 text-xs text-slate-500">Data pembanding belum mencukupi.</p> : <p className={`mt-1 flex items-center gap-1 text-sm font-extrabold ${latestChange >= 0 ? "text-emerald-700" : "text-red-600"}`}>{latestChange >= 0 ? <TrendingUp size={15}/> : <TrendingDown size={15}/>} {Math.abs(latestChange).toLocaleString("id-ID", { maximumFractionDigits: 1 })}% <span className="text-[9px] font-medium text-slate-400">dibanding bulan sebelumnya</span></p>}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-blue-600">Tren Kinerja 12 Bulan</p><h2 className="mt-1 text-sm font-extrabold text-slate-950">Penjualan dan Profitabilitas</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-bold text-slate-500">DATA REALTIME</span></div><div className="mt-4 h-72">{trendData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={trendData} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/><XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false}/><YAxis tickFormatter={(value) => `${Math.round(value / 1000)}rb`} tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} width={42}/><Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 11 }}/><Legend iconType="circle" formatter={(value) => <span className="mr-4 text-[10px] font-semibold text-slate-600">{value}</span>} wrapperStyle={{ paddingTop: 14 }}/><Bar dataKey="Penjualan" name="Penjualan" fill="#2563EB" radius={[4,4,0,0]}/><Bar dataKey="Laba Kotor" name="Laba Kotor" fill="#F59E0B" radius={[4,4,0,0]}/><Bar dataKey="Laba Bersih" name="Laba Bersih" fill="#10B981" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-xs text-slate-400">Belum ada tren bulanan untuk ditampilkan.</div>}</div><div className="mt-4 border-t border-slate-100 pt-4"><div className="mb-3"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">Indikator Rasio Periode Terpilih</p><p className="mt-0.5 text-[9px] text-slate-400">Persentase dihitung terhadap total penjualan.</p></div><div className="grid grid-cols-1 gap-2 xs:grid-cols-3"><CircleStat label="Margin Laba Kotor" value={management.grossMargin} color="#F59E0B" track="#FEF3C7" caption="Sebelum pengeluaran"/><CircleStat label="Margin Laba Bersih" value={management.netMargin} color="#10B981" track="#D1FAE5" caption="Hasil akhir usaha"/><CircleStat label="Rasio Pengeluaran" value={management.expenseRatio} color="#EF4444" track="#FEE2E2" caption="Terhadap penjualan"/></div></div><div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-[9px] font-bold"><span className="rounded-lg bg-blue-50 px-2 py-2 text-blue-700">Penjualan</span><span className="rounded-lg bg-amber-50 px-2 py-2 text-amber-700">Laba Kotor</span><span className="rounded-lg bg-emerald-50 px-2 py-2 text-emerald-700">Laba Bersih</span></div></div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-4"><div><h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><CalendarDays size={15} className="text-blue-600"/>Riwayat Arsip Bulanan</h2><p className="mt-1 text-[10px] text-slate-400">Tersimpan permanen dan hanya dapat dibaca atau diekspor.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-bold text-slate-500">{archives.length} BULAN</span></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-[10px]"><thead className="bg-slate-50 uppercase text-slate-400"><tr>{["Bulan","Pesanan","Penjualan","HPP","Laba Kotor","Pengeluaran","Laba Bersih","Status"].map((item)=><th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{archives.map((row)=><tr key={row.month_start} className="text-slate-600"><td className="px-4 py-3 font-bold text-slate-900">{new Date(`${row.month_start}T00:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</td><td className="px-4 py-3">{Number(row.total_orders).toLocaleString("id-ID")}</td><td className="px-4 py-3">{formatCurrency(row.total_sales)}</td><td className="px-4 py-3">{formatCurrency(row.cost_of_goods)}</td><td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(row.gross_profit)}</td><td className="px-4 py-3 text-red-600">{formatCurrency(row.total_expenses)}</td><td className="px-4 py-3 font-bold text-slate-950">{formatCurrency(row.net_profit)}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 font-bold ${row.closed_at ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-700"}`}>{row.closed_at ? "DIARSIPKAN" : "BERJALAN"}</span></td></tr>)}</tbody></table></div></section>
    </>}
  </div>;
}

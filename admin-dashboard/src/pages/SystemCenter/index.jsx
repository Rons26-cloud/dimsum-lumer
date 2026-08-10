import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Database, Download, FileClock, HardDrive, Loader2, RefreshCw, Search, ServerCog, ShieldCheck, Table2, XCircle } from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";

const CHECKS = [
  ["orders", "Pesanan"], ["order_items", "Item pesanan"], ["products", "Produk"],
  ["categories", "Kategori"], ["flash_sales", "Flash Sale"], ["promos", "Promo"],
  ["profiles", "Pelanggan"], ["notifications", "Notifikasi"], ["activity_logs", "Audit log"],
  ["maintenance", "Maintenance"], ["stores", "Lokasi toko"], ["app_config", "Konfigurasi"],
];
const dateTime = (value) => value ? new Date(value).toLocaleString("id-ID", { weekday: "short", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-";
const actionMeta = { INSERT: ["Ditambahkan", "bg-emerald-50 text-emerald-700"], UPDATE: ["Diperbarui", "bg-blue-50 text-blue-700"], DELETE: ["Dihapus", "bg-red-50 text-red-700"] };

function saveJson(data, name) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = `${name}-${new Date().toLocaleDateString("sv-SE")}.json`; link.style.display = "none";
  document.body.appendChild(link); link.click(); setTimeout(() => { link.remove(); URL.revokeObjectURL(url); }, 1000);
}

export default function SystemCenter() {
  const logs = useLiveCollection("activity_logs", { order: { column: "created_at", ascending: false }, limit: 250 });
  const [health, setHealth] = useState([]);
  const [checking, setChecking] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [notice, setNotice] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const runHealthCheck = async () => {
    setChecking(true); setNotice(null);
    const started = performance.now();
    const results = await Promise.all(CHECKS.map(async ([table, label]) => {
      const before = performance.now();
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      return { table, label, ok: !error, count: count ?? 0, latency: Math.round(performance.now() - before), error: error?.message || "" };
    }));
    setHealth(results); setLastCheck(new Date()); setChecking(false);
    const failed = results.filter((item) => !item.ok).length;
    setNotice(failed ? { type: "error", text: `${failed} komponen memerlukan perhatian. Buka detail status di bawah.` } : { type: "success", text: `Semua komponen sehat. Pemeriksaan selesai dalam ${Math.round(performance.now() - started)} ms.` });
  };
  useEffect(() => { runHealthCheck(); }, []);

  const visibleLogs = useMemo(() => (logs || []).filter((item) => {
    const needle = `${item.action || ""} ${item.detail || ""} ${item.entity_table || ""} ${item.entity_id || ""}`.toLowerCase();
    return (!query || needle.includes(query.toLowerCase())) && (action === "all" || item.action === action);
  }), [logs, query, action]);
  const healthy = health.filter((item) => item.ok).length;
  const averageLatency = health.length ? Math.round(health.reduce((sum, item) => sum + item.latency, 0) / health.length) : 0;

  const backup = async () => {
    setBackingUp(true); setNotice(null);
    const tables = ["products", "categories", "orders", "order_items", "promos", "flash_sales", "stores", "app_config"];
    const entries = await Promise.all(tables.map(async (table) => { const { data, error } = await supabase.from(table).select("*").limit(10000); return [table, { data: data || [], error: error?.message || null }]; }));
    const payload = { application: "Dimsum Lumer Admin", exported_at: new Date().toISOString(), version: 1, tables: Object.fromEntries(entries) };
    saveJson(payload, "backup-dimsum-lumer"); setBackingUp(false);
    const errors = entries.filter(([, value]) => value.error).length;
    setNotice(errors ? { type: "error", text: `Backup diunduh, tetapi ${errors} tabel gagal dibaca. Detail error tersimpan di file.` } : { type: "success", text: "Backup operasional berhasil dibuat dan diunduh otomatis." });
  };

  return <div className="space-y-5">
    <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-xl sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"><ServerCog size={14}/>Control Plane</span><h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">Pusat Sistem & Audit</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Pantau kesehatan Supabase, periksa jejak perubahan administrator, dan buat backup data operasional.</p></div><div className="grid grid-cols-2 gap-2 sm:flex"><button onClick={runHealthCheck} disabled={checking} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold disabled:opacity-50"><RefreshCw size={15} className={checking ? "animate-spin" : ""}/>{checking ? "Memeriksa..." : "Periksa Sistem"}</button><button onClick={backup} disabled={backingUp} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg disabled:opacity-50">{backingUp ? <Loader2 className="animate-spin" size={15}/> : <Download size={15}/>}Backup JSON</button></div></div></header>
    {notice && <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{notice.type === "success" ? <CheckCircle2 size={15}/> : <AlertTriangle size={15}/>}<span>{notice.text}</span></div>}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Stat label="Komponen sehat" value={`${healthy}/${health.length || CHECKS.length}`} note="Tabel dapat diakses" Icon={ShieldCheck} color="bg-emerald-600"/><Stat label="Perlu perhatian" value={health.filter((item) => !item.ok).length} note="Schema, RLS, atau koneksi" Icon={AlertTriangle} color="bg-red-600"/><Stat label="Respons rata-rata" value={`${averageLatency} ms`} note="Latency pemeriksaan Supabase" Icon={Activity} color="bg-blue-600"/><Stat label="Audit tersimpan" value={(logs || []).length} note="Aktivitas terbaru realtime" Icon={FileClock} color="bg-violet-600"/></div>

    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="flex items-center gap-2 font-bold text-gray-900"><Database size={17} className="text-emerald-600"/>Kesehatan Database</h2><p className="mt-1 text-xs text-gray-400">{lastCheck ? `Terakhir diperiksa ${dateTime(lastCheck)}` : "Menunggu pemeriksaan"}</p></div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"/>MONITOR AKTIF</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(health.length ? health : CHECKS.map(([table,label]) => ({ table,label,loading:true }))).map((item) => <article key={item.table} className={`rounded-2xl border p-4 ${item.loading ? "border-gray-100 bg-gray-50" : item.ok ? "border-emerald-100 bg-emerald-50/40" : "border-red-200 bg-red-50/60"}`}><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${item.loading ? "bg-gray-200 text-gray-400" : item.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>{item.loading ? <Loader2 className="animate-spin" size={16}/> : item.ok ? <CheckCircle2 size={17}/> : <XCircle size={17}/>}</span><div className="min-w-0 flex-1"><h3 className="text-xs font-bold text-gray-800">{item.label}</h3><p className="font-mono text-[9px] text-gray-400">public.{item.table}</p></div>{!item.loading && <strong className={`text-[10px] ${item.ok ? "text-emerald-600" : "text-red-600"}`}>{item.ok ? `${item.latency} ms` : "GAGAL"}</strong>}</div>{!item.loading && <div className="mt-3 border-t border-black/5 pt-3 text-[10px]"><p className={item.ok ? "text-gray-500" : "text-red-600"}>{item.ok ? `${item.count.toLocaleString("id-ID")} baris tersedia` : item.error}</p></div>}</article>)}</div></section>

    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5"><div><h2 className="flex items-center gap-2 font-bold text-gray-900"><FileClock size={17} className="text-violet-600"/>Audit Aktivitas Admin</h2><p className="mt-1 text-xs text-gray-400">Riwayat perubahan data lengkap dengan waktu dan administrator.</p></div><div className="grid gap-2 sm:grid-cols-[240px_150px]"><label className="flex min-h-10 items-center gap-2 rounded-xl border px-3"><Search size={14} className="text-gray-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari aktivitas..." className="w-full text-xs outline-none"/></label><select value={action} onChange={(e) => setAction(e.target.value)} className="min-h-10 rounded-xl border px-3 text-xs font-semibold"><option value="all">Semua tindakan</option><option value="INSERT">Ditambahkan</option><option value="UPDATE">Diperbarui</option><option value="DELETE">Dihapus</option></select></div></div>
      {logs === null ? <div className="grid min-h-52 place-items-center"><Loader2 className="animate-spin text-primary"/></div> : visibleLogs.length ? <div className="divide-y divide-gray-50">{visibleLogs.map((item) => { const info = actionMeta[item.action] || [item.action || "Aktivitas", "bg-gray-100 text-gray-600"]; return <article key={item.id} className="flex gap-3 p-4 transition hover:bg-gray-50 sm:px-5"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${info[1]}`}><Table2 size={16}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-xs text-gray-800">{info[0]}</strong><span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[8px] font-bold text-gray-500">{item.entity_table || "sistem"}</span></div><p className="mt-1 text-[10px] leading-5 text-gray-500">{item.detail || `${info[0]} data ${item.entity_table || "Dashboard"}`}</p><div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-gray-400"><span className="flex items-center gap-1"><Clock3 size={10}/>{dateTime(item.occurred_at || item.created_at)}</span><span className="font-mono">Admin: {item.admin_id ? String(item.admin_id).slice(0,8) : "Sistem"}</span>{item.entity_id && <span className="font-mono">ID: {String(item.entity_id).slice(0,8)}</span>}</div></div></article>; })}</div> : <div className="px-5 py-14 text-center"><HardDrive className="mx-auto text-gray-300" size={34}/><h3 className="mt-3 text-sm font-bold text-gray-700">Belum ada audit aktivitas</h3><p className="mt-1 text-xs text-gray-400">Jalankan system-audit-center.sql agar perubahan berikutnya tercatat otomatis.</p></div>}
    </section>
  </div>;
}

function Stat({ label, value, note, Icon, color }) { return <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl text-white ${color}`}><Icon size={17}/></span><strong className="text-xl text-gray-900 sm:text-2xl">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</strong></div><p className="mt-3 text-[10px] font-bold text-gray-600">{label}</p><p className="mt-1 text-[9px] text-gray-400">{note}</p></article>; }

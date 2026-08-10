import { useMemo, useState } from "react";
import { AlertTriangle, Bell, BellRing, CheckCheck, Clock3, Eye, EyeOff, Loader2, Package, Percent, RefreshCw, Search, ShoppingBag, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { TABLES } from "../../supabase/constants.js";
import { supabase } from "../../supabase/client.js";

const typeOf = (item) => String(item.type || item.notification_type || "system").toLowerCase();
const titleOf = (item) => item.title || item.subject || "Notifikasi baru";
const messageOf = (item) => item.message || item.body || item.description || "Ada pembaruan baru pada sistem Dashboard.";
const categoryOf = (item) => { const type = typeOf(item); if (type.includes("order") || type.includes("payment")) return "order"; if (type.includes("promo") || type.includes("flash")) return "promo"; if (type.includes("product") || type.includes("stock")) return "product"; return "system"; };
const destination = (item) => { const category = categoryOf(item); if (category === "order" || item.order_id) return "/pesanan"; if (typeOf(item).includes("flash")) return "/flash-sale"; if (category === "promo") return "/promo"; if (category === "product") return "/produk"; return "/"; };
const formatDate = (value) => value ? new Date(value).toLocaleString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "Waktu tidak tersedia";
const timeAgo = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value || 0).getTime()) / 1000));
  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
  return "Riwayat lama";
};
const meta = {
  order: { label: "Pesanan", Icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
  promo: { label: "Promo", Icon: Percent, color: "bg-violet-50 text-violet-600" },
  product: { label: "Produk", Icon: Package, color: "bg-amber-50 text-amber-600" },
  system: { label: "Sistem", Icon: BellRing, color: "bg-gray-100 text-gray-600" },
};

export default function Notification() {
  const navigate = useNavigate();
  const liveRows = useLiveCollection(TABLES.NOTIFICATIONS);
  const rows = useMemo(() => [...(liveRows || [])].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)), [liveRows]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [period, setPeriod] = useState("all");
  const [selected, setSelected] = useState(null);
  const [working, setWorking] = useState("");
  const [notice, setNotice] = useState(null);
  const unread = rows.filter((item) => item.is_read !== true);
  const today = rows.filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString());
  const filtered = useMemo(() => rows.filter((item) => {
    const text = `${titleOf(item)} ${messageOf(item)}`.toLowerCase();
    const age = Date.now() - new Date(item.created_at || 0).getTime();
    return (!query || text.includes(query.toLowerCase())) && (status === "all" || (status === "unread" ? item.is_read !== true : item.is_read === true)) && (category === "all" || categoryOf(item) === category) && (period === "all" || (period === "today" ? age <= 86_400_000 : age <= 7 * 86_400_000));
  }), [rows, query, status, category, period]);

  const updateRead = async (items, isRead) => {
    const ids = items.map((item) => item.id).filter(Boolean); if (!ids.length) return;
    setWorking(isRead ? "read" : "unread"); setNotice(null);
    const { error } = await supabase.from(TABLES.NOTIFICATIONS).update({ is_read: isRead }).in("id", ids);
    setWorking("");
    if (error) return setNotice({ type: "error", text: error.message });
    if (selected && ids.includes(selected.id)) setSelected({ ...selected, is_read: isRead });
    setNotice({ type: "success", text: `${ids.length} notifikasi berhasil ditandai ${isRead ? "sudah" : "belum"} dibaca.` });
  };
  const removeOne = async (item) => {
    if (!confirm(`Hapus notifikasi “${titleOf(item)}”?`)) return;
    setWorking(item.id); setNotice(null);
    const { error } = await supabase.from(TABLES.NOTIFICATIONS).delete().eq("id", item.id);
    setWorking("");
    if (error) return setNotice({ type: "error", text: error.message });
    setSelected(null); setNotice({ type: "success", text: "Notifikasi berhasil dihapus dari Supabase." });
  };
  const clearRead = async () => {
    const ids = rows.filter((item) => item.is_read === true).map((item) => item.id);
    if (!ids.length || !confirm(`Hapus permanen ${ids.length} notifikasi yang sudah dibaca?`)) return;
    setWorking("delete-read"); const { error } = await supabase.from(TABLES.NOTIFICATIONS).delete().in("id", ids); setWorking("");
    setNotice(error ? { type: "error", text: error.message } : { type: "success", text: `${ids.length} notifikasi lama berhasil dibersihkan.` });
  };

  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-primary"><BellRing size={20}/></span><div><h1 className="text-xl font-bold text-gray-900">Notifikasi Admin</h1><p className="text-xs text-gray-500">Pusat aktivitas operasional yang terhubung realtime dengan Supabase.</p></div></div></div><div className="flex gap-2"><button onClick={() => window.dispatchEvent(new CustomEvent("admin:refresh-data", { detail: { table: TABLES.NOTIFICATIONS } }))} className="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-white px-3 text-xs font-bold text-gray-600"><RefreshCw size={14}/>Refresh</button><button onClick={clearRead} disabled={working === "delete-read" || !rows.some((item) => item.is_read === true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-600 disabled:opacity-40">{working === "delete-read" ? <Loader2 className="animate-spin" size={14}/> : <Trash2 size={14}/>}Bersihkan</button></div></header>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total notifikasi" value={rows.length} Icon={Bell} color="bg-gray-900"/><Stat label="Pesan baru · belum dibaca" value={unread.length} Icon={BellRing} color="bg-red-600"/><Stat label="Masuk hari ini" value={today.length} Icon={Clock3} color="bg-blue-600"/><Stat label="Sudah dibaca" value={rows.length - unread.length} Icon={CheckCheck} color="bg-emerald-600"/></div>
    {notice && <div className={`flex items-center justify-between rounded-xl border p-3 text-xs ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><span>{notice.text}</span><button onClick={() => setNotice(null)}><X size={14}/></button></div>}

    <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="grid gap-3 border-b p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_repeat(3,150px)_auto]"><div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari judul atau isi notifikasi..." className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-xs outline-none focus:border-primary"/></div><Filter value={status} onChange={setStatus} options={[["all","Semua status"],["unread","Belum dibaca"],["read","Sudah dibaca"]]}/><Filter value={category} onChange={setCategory} options={[["all","Semua kategori"],["order","Pesanan"],["product","Produk"],["promo","Promo"],["system","Sistem"]]}/><Filter value={period} onChange={setPeriod} options={[["all","Semua waktu"],["today","Hari ini"],["week","7 hari terakhir"]]}/><button onClick={() => updateRead(unread, true)} disabled={!unread.length || working === "read"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[10px] font-bold text-white disabled:opacity-40">{working === "read" ? <Loader2 className="animate-spin" size={14}/> : <CheckCheck size={14}/>}Baca semua</button></div>
      <div className="space-y-2 bg-gray-50/50 p-3 sm:p-4">{liveRows === null ? <div className="grid min-h-64 place-items-center"><Loader2 className="animate-spin text-primary"/></div> : filtered.length ? filtered.map((item) => { const config = meta[categoryOf(item)]; const Icon = config.Icon; const isUnread = item.is_read !== true; return <article key={item.id} className={`group flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-start ${isUnread ? "border-red-200 bg-red-50/70" : "border-emerald-200 bg-emerald-50/55"}`}><button onClick={() => setSelected(item)} className="flex min-w-0 flex-1 items-start gap-3 text-left"><span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isUnread ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}><Icon size={18}/>{isUnread && <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-red-500"/>}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="text-xs text-gray-900">{titleOf(item)}</strong><span className={`rounded-full px-2.5 py-1 text-[8px] font-extrabold ${isUnread ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>{isUnread ? "PESAN BARU" : "SUDAH DIBACA"}</span><span className="rounded-full bg-white/80 px-2 py-0.5 text-[8px] font-semibold text-gray-500">{config.label}</span></span><span className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-gray-600">{messageOf(item)}</span><span className={`mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-white/75 px-2.5 py-1.5 text-[9px] font-semibold ${isUnread ? "text-red-700" : "text-emerald-700"}`}><Clock3 size={11}/><strong>{timeAgo(item.created_at)}</strong><span className="text-gray-400">·</span><span>{formatDate(item.created_at)}</span></span></span></button><div className="flex shrink-0 gap-2 pl-14 sm:pl-0"><button onClick={() => updateRead([item], isUnread)} title={isUnread ? "Tandai dibaca" : "Tandai belum dibaca"} className={`grid h-9 w-9 place-items-center rounded-xl border bg-white ${isUnread ? "border-red-200 text-red-600" : "border-emerald-200 text-emerald-600"}`}>{isUnread ? <Eye size={14}/> : <EyeOff size={14}/>}</button><button onClick={() => removeOne(item)} disabled={working === item.id} title="Hapus notifikasi" className="grid h-9 w-9 place-items-center rounded-xl border border-red-100 bg-white text-red-500">{working === item.id ? <Loader2 className="animate-spin" size={14}/> : <Trash2 size={14}/>}</button></div></article>; }) : <div className="rounded-2xl bg-white px-6 py-16 text-center"><Bell className="mx-auto text-gray-300" size={34}/><h2 className="mt-3 text-sm font-bold text-gray-700">Notifikasi tidak ditemukan</h2><p className="mt-1 text-xs text-gray-400">Ubah kata pencarian atau filter yang digunakan.</p></div>}</div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-gray-50 px-4 py-3 text-[10px] text-gray-500"><span>Menampilkan <strong>{filtered.length}</strong> dari {rows.length} notifikasi</span><span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"/>Realtime aktif</span></footer>
    </section>

    {selected && <div className="fixed inset-0 z-[70] grid place-items-center bg-gray-950/55 p-3 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}><section className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-3"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${meta[categoryOf(selected)].color}`}>{(() => { const Icon = meta[categoryOf(selected)].Icon; return <Icon size={21}/>; })()}</span><button onClick={() => setSelected(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100 text-gray-500"><X size={16}/></button></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[9px] font-bold text-gray-600">{meta[categoryOf(selected)].label}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${selected.is_read ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-primary"}`}>{selected.is_read ? "SUDAH DIBACA" : "BELUM DIBACA"}</span></div><h2 className="mt-3 text-lg font-bold text-gray-900">{titleOf(selected)}</h2><p className="mt-2 text-xs leading-6 text-gray-600">{messageOf(selected)}</p><div className="mt-4 rounded-xl bg-gray-50 p-3 text-[10px] text-gray-500"><Clock3 className="mr-1 inline" size={12}/>{formatDate(selected.created_at)}<p className="mt-1 break-all font-mono text-[9px] text-gray-400">ID: {selected.id}</p></div><div className="mt-5 grid gap-2 sm:grid-cols-3"><button onClick={() => updateRead([selected], selected.is_read !== true)} className="min-h-11 rounded-xl border text-xs font-bold text-gray-600">{selected.is_read ? "Belum dibaca" : "Tandai dibaca"}</button><button onClick={() => { setSelected(null); navigate(destination(selected)); }} className="min-h-11 rounded-xl bg-gray-900 text-xs font-bold text-white">Buka halaman terkait</button><button onClick={() => removeOne(selected)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-bold text-red-600"><Trash2 size={14}/>Hapus</button></div></section></div>}
  </div>;
}

function Stat({ label, value, Icon, color }) { return <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl text-white ${color}`}><Icon size={17}/></span><strong className="text-2xl text-gray-900">{value.toLocaleString("id-ID")}</strong></div><p className="mt-3 text-[10px] font-semibold text-gray-500">{label}</p></div>; }
function Filter({ value, onChange, options }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 outline-none focus:border-primary">{options.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>; }

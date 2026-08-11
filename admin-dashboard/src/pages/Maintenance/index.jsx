import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, Clock3, Globe2, RefreshCw, Save, ShieldCheck, Wrench } from "lucide-react";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";
import { setMaintenance } from "../../services/maintenanceService.js";
import logo from "../../assets/logo/maintenance-logo-transparent.png";

const DEFAULT_MESSAGE = "Mohon maaf, Dimsum Lumer sedang dalam pemeliharaan untuk meningkatkan kualitas layanan. Silakan kembali beberapa saat lagi.";
const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};
const toIso = (value) => value ? new Date(value).toISOString() : null;
const formatCountdown = (milliseconds) => {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor(total / 3600) % 24;
  const minutes = Math.floor(total / 60) % 60;
  const seconds = total % 60;
  return `${days ? `${days} hari ` : ""}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function Maintenance() {
  const rows = useLiveCollection("maintenance");
  const [selectedTarget, setSelectedTarget] = useState("both");
  const liveRow = useMemo(() => (rows || []).find((item) => item.target === (selectedTarget === "mobile-apk" ? "mobile-apk" : "frontend-web")) || null, [rows, selectedTarget]);
  const [form, setForm] = useState({ is_active: false, message: DEFAULT_MESSAGE, start_time: "", end_time: "" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!liveRow) return;
    setForm({ is_active: Boolean(liveRow.is_active), message: liveRow.message || DEFAULT_MESSAGE, start_time: toLocalInput(liveRow.start_time), end_time: toLocalInput(liveRow.end_time) });
  }, [liveRow]);

  const scheduleActive = Boolean(form.start_time || form.end_time);
  const now = new Date(clock);
  const withinSchedule = (!form.start_time || now >= new Date(form.start_time)) && (!form.end_time || now <= new Date(form.end_time));
  const effectiveActive = form.is_active && withinSchedule;
  const invalidSchedule = form.start_time && form.end_time && new Date(form.end_time) <= new Date(form.start_time);
  const scheduledStartMs = form.start_time ? new Date(form.start_time).getTime() : null;
  const scheduledEndMs = form.end_time ? new Date(form.end_time).getTime() : null;
  const waitingToStart = form.is_active && scheduledStartMs && clock < scheduledStartMs;
  const remainingMs = waitingToStart ? scheduledStartMs - clock : effectiveActive && scheduledEndMs ? scheduledEndMs - clock : 0;

  const persist = async (nextActive, useSchedule = true) => {
    if (useSchedule && invalidSchedule) return setNotice({ type: "error", text: "Waktu selesai harus lebih besar dari waktu mulai." });
    setSaving(true); setNotice(null);
    try {
      const targets = selectedTarget === "both" ? ["frontend-web", "mobile-apk"] : [selectedTarget];
      const schedule = useSchedule ? { start_time: toIso(form.start_time), end_time: toIso(form.end_time) } : { start_time: null, end_time: null };
      await Promise.all(targets.map((target) => setMaintenance(target, nextActive, form.message || DEFAULT_MESSAGE, schedule)));
      setForm((value) => ({ ...value, is_active: nextActive, ...(useSchedule ? {} : { start_time: "", end_time: "" }) }));
      setNotice({ type: "success", text: `${nextActive ? "Maintenance aktif" : "Maintenance dinonaktifkan"} dan sudah diverifikasi di Supabase untuk ${selectedTarget === "both" ? "Frontend Web dan APK" : selectedTarget === "mobile-apk" ? "APK" : "Frontend Web"}.` });
      window.dispatchEvent(new CustomEvent("admin:refresh-data", { detail: { table: "maintenance" } }));
    } catch (error) { setNotice({ type: "error", text: error.message || "Pengaturan maintenance gagal disimpan." }); }
    finally { setSaving(false); }
  };
  const save = async (event) => { event.preventDefault(); await persist(scheduleActive ? true : form.is_active, true); };

  if (rows === null) return <div className="animate-pulse space-y-5"><div className="h-32 rounded-3xl bg-gray-100"/><div className="h-96 rounded-3xl bg-gray-100"/></div>;

  return <div className="animate-fade-in space-y-5 sm:space-y-6">
    <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 p-5 text-white shadow-xl sm:p-7"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-orange-300"><Wrench size={15}/> Kontrol sistem</div><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Maintenance Center</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">Aktifkan halaman pemeliharaan frontend secara realtime, atur jadwal, dan sampaikan informasi yang jelas kepada pelanggan.</p></div><div className={`rounded-2xl border px-4 py-3 backdrop-blur ${effectiveActive ? "border-amber-400/30 bg-amber-400/15" : "border-emerald-400/30 bg-emerald-400/15"}`}><p className="text-[10px] uppercase tracking-wide text-white/60">Status frontend saat ini</p><div className="mt-1 flex items-center gap-2 text-sm font-bold"><span className={`h-2.5 w-2.5 rounded-full ${effectiveActive ? "animate-pulse bg-amber-400" : "bg-emerald-400"}`}/>{effectiveActive ? "SEDANG MAINTENANCE" : "BEROPERASI NORMAL"}</div></div></div></header>

    {notice && <div role="alert" className={`rounded-2xl border p-4 text-sm font-medium ${notice.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{notice.text}</div>}

    {form.is_active && scheduleActive && <section className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${waitingToStart ? "border-blue-200 bg-blue-50 text-blue-900" : effectiveActive ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}><div><p className="text-xs font-extrabold uppercase tracking-wide">{waitingToStart ? "Maintenance terjadwal" : effectiveActive ? "Maintenance sedang berlangsung" : "Jadwal telah selesai"}</p><p className="mt-1 text-xs opacity-75">{waitingToStart ? "Pengguna sudah menerima pemberitahuan sebelum sistem ditutup." : effectiveActive ? "Web dan APK akan pulih otomatis saat waktu selesai." : "Layanan pengguna telah kembali berjalan normal secara otomatis."}</p></div>{remainingMs > 0 && <div className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2 text-sm font-black shadow-sm"><Clock3 size={16}/>{waitingToStart ? "Mulai dalam" : "Pulih dalam"} {formatCountdown(remainingMs)}</div>}</section>}

    <div className="grid gap-5 xl:grid-cols-3">
      <form onSubmit={save} className="space-y-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2"><div><p className="text-xs font-bold text-gray-700">Pilih target maintenance</p><p className="mt-1 text-[10px] text-gray-400">Atur website, aplikasi Android, atau keduanya sekaligus.</p><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">{[{ key: "both", label: "Web + APK", note: "Semua aplikasi" }, { key: "frontend-web", label: "Frontend Web", note: "Website pelanggan" }, { key: "mobile-apk", label: "Mobile APK", note: "Aplikasi Android" }].map((target) => <button key={target.key} type="button" onClick={() => setSelectedTarget(target.key)} className={`rounded-xl border p-3 text-left transition ${selectedTarget === target.key ? "border-orange-500 bg-orange-50 ring-2 ring-orange-100" : "border-gray-200 bg-white hover:bg-gray-50"}`}><span className={`block text-xs font-bold ${selectedTarget === target.key ? "text-orange-700" : "text-gray-700"}`}>{target.label}</span><span className="mt-1 block text-[9px] text-gray-400">{target.note}</span></button>)}</div></div><div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"><div className="flex gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${form.is_active ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{form.is_active ? <Wrench size={21}/> : <CheckCircle2 size={21}/>}</span><div><p className="text-sm font-bold text-gray-900">Mode maintenance {selectedTarget === "both" ? "Web & APK" : selectedTarget === "mobile-apk" ? "APK" : "Frontend"}</p><p className="mt-1 text-xs leading-5 text-gray-500">Pelanggan akan melihat halaman pemeliharaan dan tidak dapat mengakses toko.</p></div></div><button type="button" role="switch" aria-checked={form.is_active} onClick={() => setForm((value) => ({ ...value, is_active: !value.is_active }))} className={`relative h-9 w-16 shrink-0 rounded-full transition ${form.is_active ? "bg-amber-500" : "bg-gray-300"}`}><span className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${form.is_active ? "left-8" : "left-1"}`}/></button></div>

        <label className="block"><span className="text-xs font-bold text-gray-700">Pesan untuk pelanggan</span><span className="mt-1 block text-[10px] text-gray-400">Jelaskan alasan pemeliharaan dan perkiraan layanan kembali normal.</span><textarea rows={5} maxLength={500} value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50" placeholder={DEFAULT_MESSAGE}/><span className="mt-1 block text-right text-[10px] text-gray-400">{form.message.length}/500 karakter</span></label>

        <div><div className="flex items-center gap-2"><CalendarClock size={17} className="text-orange-600"/><p className="text-sm font-bold text-gray-800">Jadwal maintenance</p></div><p className="mt-1 text-xs text-gray-400">Kosongkan keduanya untuk mengaktifkan atau menonaktifkan secara manual.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-gray-600">Mulai<input type="datetime-local" value={form.start_time} onChange={(event) => setForm((value) => ({ ...value, start_time: event.target.value }))} className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-orange-500"/></label><label className="text-xs font-semibold text-gray-600">Selesai<input type="datetime-local" value={form.end_time} onChange={(event) => setForm((value) => ({ ...value, end_time: event.target.value }))} className={`mt-2 min-h-12 w-full min-w-0 rounded-xl border bg-white px-3 text-sm text-gray-800 outline-none ${invalidSchedule ? "border-red-400" : "border-gray-200 focus:border-orange-500"}`}/></label></div>{invalidSchedule && <p className="mt-2 text-xs font-medium text-red-600">Waktu selesai harus setelah waktu mulai.</p>}</div>

        <div className="grid gap-3 sm:grid-cols-2"><button type="button" disabled={saving} onClick={() => persist(true, false)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-bold text-white shadow-lg shadow-amber-200 hover:bg-amber-600 disabled:opacity-50"><Wrench size={17}/>Aktifkan sekarang</button><button type="button" disabled={saving} onClick={() => persist(false, false)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><CheckCircle2 size={17}/>Nonaktifkan</button></div><button disabled={saving || invalidSchedule} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <RefreshCw size={17} className="animate-spin"/> : <Save size={17}/>} {saving ? "Menyimpan ke Supabase..." : "Simpan pengaturan & jadwal"}</button>
      </form>

      <aside className="space-y-5"><section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wide text-gray-500">Pratinjau pelanggan</p><p className="mt-0.5 text-[10px] text-gray-400">Tampilan saat maintenance aktif</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[9px] font-bold text-emerald-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"/>LIVE PREVIEW</span></div><div className="relative isolate overflow-hidden bg-gradient-to-b from-orange-50 via-white to-amber-50 px-5 py-8 text-center"><div className="absolute -left-16 -top-16 -z-10 h-44 w-44 rounded-full bg-orange-200/30 blur-2xl"/><div className="absolute -bottom-20 -right-12 -z-10 h-48 w-48 rounded-full bg-amber-200/40 blur-2xl"/><div className="relative mx-auto h-28 w-28"><span className="absolute inset-0 animate-ping rounded-full border border-orange-300/40"/><span className="absolute inset-2 animate-pulse rounded-full bg-orange-200/50 blur-md"/><div className="absolute inset-3 animate-[bounce_2.4s_ease-in-out_infinite] overflow-hidden rounded-full border-4 border-white bg-white shadow-xl shadow-orange-200"><img src={logo} alt="Logo Dimsum Lumer bergerak" className="h-full w-full object-cover"/></div><span className="absolute bottom-1 right-0 grid h-9 w-9 animate-[pulse_1.8s_ease-in-out_infinite] place-items-center rounded-full border-4 border-white bg-orange-500 text-white shadow-lg"><Wrench size={15}/></span></div><span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white/80 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-orange-600 shadow-sm backdrop-blur"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500"/>Pembaruan sistem berlangsung</span><h2 className="mt-4 text-xl font-extrabold tracking-tight text-gray-900">Sedang Dalam Perbaikan</h2><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-gray-500">{form.message || DEFAULT_MESSAGE}</p><div className="mt-5 rounded-2xl border border-orange-100 bg-white/85 p-3 shadow-sm backdrop-blur"><div className="flex items-center justify-center gap-2 text-[10px] font-bold text-orange-700"><Clock3 size={13}/>Sistem akan segera kembali normal</div><div className="mt-3 flex gap-1.5">{[0,1,2,3,4].map((item) => <span key={item} className="h-1.5 flex-1 overflow-hidden rounded-full bg-orange-100"><span className="block h-full w-full origin-left animate-pulse rounded-full bg-gradient-to-r from-orange-400 to-amber-400" style={{ animationDelay: `${item * 180}ms` }}/></span>)}</div></div><div className="mt-5 flex items-center justify-center gap-2 border-t border-orange-100/70 pt-4 text-[9px] text-gray-400"><ShieldCheck size={12} className="text-emerald-500"/>Data pelanggan tetap aman selama pemeliharaan</div></div></section><section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-sm font-bold text-gray-900"><ShieldCheck size={17} className="text-emerald-600"/>Informasi kontrol</h2><div className="mt-4 space-y-3 text-xs"><div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3"><span className="flex items-center gap-2 text-gray-500"><Globe2 size={14}/>Target</span><strong className="text-gray-800">Frontend Web</strong></div><div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3"><span className="flex items-center gap-2 text-gray-500"><CalendarClock size={14}/>Jadwal</span><strong className="text-right text-gray-800">{scheduleActive ? "Terjadwal" : "Manual"}</strong></div><div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3"><span className="flex items-center gap-2 text-gray-500"><Activity size={14}/>Sinkronisasi</span><strong className="text-emerald-600">Realtime</strong></div></div><div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-[10px] leading-4 text-amber-700"><AlertTriangle size={15} className="shrink-0"/>Pastikan pekerjaan selesai sebelum menonaktifkan maintenance agar pelanggan tidak mengalami error.</div></section></aside>
    </div>
  </div>;
}

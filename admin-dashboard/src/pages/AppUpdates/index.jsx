import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, History, Loader2, RefreshCw, Save, Smartphone } from "lucide-react";
import Modal from "../../components/ui/Modal.jsx";
import { getAppUpdateHistory, publishAppUpdate } from "../../services/appUpdateService.js";

const blankForm = {
  version_name: "1.2.3", build_number: 6, minimum_build_number: 6,
  release_title: "Dimsum Lumer 1.2.3", release_notes: "", download_url: "",
  force_update: false, update_enabled: false,
};

const inputClass = "mt-1.5 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

function Toggle({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-orange-500" : "bg-gray-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`}/></button>;
}

export default function AppUpdatesPage() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const releases = await getAppUpdateHistory();
      setRows(releases);
      const current = releases.find((row) => row.status === "published");
      if (current) setForm({
        version_name: current.version_name,
        build_number: current.build_number,
        minimum_build_number: current.minimum_build_number,
        release_title: current.release_title,
        release_notes: Array.isArray(current.release_notes) ? current.release_notes.join("\n") : "",
        download_url: current.download_url || "",
        force_update: current.force_update,
        update_enabled: current.update_enabled,
      });
    } catch (requestError) { setError(requestError.message || "Data update aplikasi tidak dapat dimuat."); setRows([]); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const current = useMemo(() => rows?.find((row) => row.status === "published") || null, [rows]);
  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const requestSave = (event) => { event.preventDefault(); setError(""); setSuccess(""); setConfirming(true); };
  const save = async () => {
    setSaving(true); setError("");
    try {
      await publishAppUpdate(form);
      setConfirming(false);
      setSuccess("Pengaturan update aplikasi berhasil disimpan.");
      await load();
    } catch (requestError) { setError(requestError.message || "Pengaturan tidak dapat disimpan."); setConfirming(false); }
    finally { setSaving(false); }
  };

  return <div className="space-y-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="flex items-center gap-2 text-xl font-bold text-gray-900"><Smartphone className="text-orange-500"/>Update Aplikasi</h1><p className="mt-1 text-sm text-gray-500">Kelola versi Android yang tersedia untuk pengguna.</p></div><button type="button" onClick={load} disabled={rows === null} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-600 disabled:opacity-50"><RefreshCw size={14}/>Muat Ulang</button></header>
    {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {success && <p className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}

    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/><h2 className="font-bold text-gray-900">Versi Produksi Saat Ini</h2></div>{rows === null ? <div className="grid min-h-32 place-items-center"><Loader2 className="animate-spin text-orange-500"/></div> : <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Version Name",current?.version_name || "-"],["Build Number",current?.build_number ?? "-"],["Package ID","com.dimsumlumer.dimsum_lumer"],["Platform","Android"],["Status",current?.status === "published" ? "Aktif" : "Belum aktif"]].map(([label,value])=><div key={label} className="rounded-xl bg-gray-50 p-3"><dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</dt><dd className="mt-1 break-all text-sm font-bold text-gray-800">{value}</dd></div>)}</dl>}</section>

    <form onSubmit={requestSave} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"><h2 className="font-bold text-gray-900">Pengaturan Update</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3"><div><strong className="text-sm text-gray-800">Update Aktif</strong><p className="text-[10px] text-gray-400">Aktifkan pemeriksaan update pada aplikasi.</p></div><Toggle label="Update Aktif" checked={form.update_enabled} onChange={(value)=>set("update_enabled",value)}/></div>
      <fieldset className="rounded-xl border border-gray-100 p-3"><legend className="px-1 text-xs font-bold text-gray-600">Jenis Update</legend><div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="updateType" checked={!form.force_update} onChange={()=>set("force_update",false)} className="accent-orange-500"/>Optional</label><label className="flex items-center gap-2"><input type="radio" name="updateType" checked={form.force_update} onChange={()=>set("force_update",true)} className="accent-orange-500"/>Force Update</label></div></fieldset>
      <label className="text-xs font-bold text-gray-600">Latest Version<input required value={form.version_name} onChange={(e)=>set("version_name",e.target.value)} placeholder="1.2.4" className={inputClass}/></label>
      <label className="text-xs font-bold text-gray-600">Latest Build Number<input required min="1" step="1" type="number" value={form.build_number} onChange={(e)=>set("build_number",e.target.value)} className={inputClass}/></label>
      <label className="text-xs font-bold text-gray-600">Minimum Supported Build<input required min="1" step="1" type="number" value={form.minimum_build_number} onChange={(e)=>set("minimum_build_number",e.target.value)} className={inputClass}/></label>
      <label className="text-xs font-bold text-gray-600">Download URL<input type="url" value={form.download_url} onChange={(e)=>set("download_url",e.target.value)} placeholder="https://..." className={inputClass}/></label>
      <label className="text-xs font-bold text-gray-600 lg:col-span-2">Release Title<input required maxLength="120" value={form.release_title} onChange={(e)=>set("release_title",e.target.value)} className={inputClass}/></label>
      <label className="text-xs font-bold text-gray-600 lg:col-span-2">Release Notes<textarea rows="5" value={form.release_notes} onChange={(e)=>set("release_notes",e.target.value)} placeholder="Satu catatan per baris" className={`${inputClass} resize-y py-3`}/></label>
    </div><button disabled={saving} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm disabled:opacity-50 sm:w-auto">{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}Simpan Pengaturan</button></form>

    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-gray-100 p-4 sm:p-5"><History size={18} className="text-violet-500"/><h2 className="font-bold text-gray-900">Riwayat Update</h2></div>{rows === null ? <div className="grid min-h-32 place-items-center"><Loader2 className="animate-spin text-orange-500"/></div> : rows.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-gray-50 text-gray-400"><tr><th className="px-4 py-3">Version</th><th className="px-4 py-3">Build</th><th className="px-4 py-3">Minimum</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Published</th></tr></thead><tbody className="divide-y divide-gray-50">{rows.map((row)=><tr key={row.id}><td className="px-4 py-3 font-bold text-gray-800">{row.version_name}</td><td className="px-4 py-3">{row.build_number}</td><td className="px-4 py-3">{row.minimum_build_number}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${row.status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{row.status === "published" ? "Published" : row.status === "disabled" ? "Previous" : "Draft"}</span></td><td className="whitespace-nowrap px-4 py-3 text-gray-500">{row.published_at ? new Date(row.published_at).toLocaleString("id-ID") : "-"}</td></tr>)}</tbody></table></div> : <div className="px-6 py-12 text-center"><Download className="mx-auto text-gray-300"/><p className="mt-2 text-sm font-semibold text-gray-600">Belum ada riwayat update</p></div>}</section>

    <Modal open={confirming} title="Simpan perubahan update aplikasi?" onClose={()=>!saving&&setConfirming(false)}><div className="space-y-4"><div className="flex gap-3 rounded-xl bg-amber-50 p-3 text-amber-800"><AlertTriangle className="mt-0.5 shrink-0" size={18}/><p className="text-sm">Perubahan ini dapat memengaruhi pengguna aplikasi Android.</p></div><div className="grid grid-cols-2 gap-2"><button type="button" disabled={saving} onClick={()=>setConfirming(false)} className="min-h-11 rounded-xl bg-gray-100 text-sm font-bold text-gray-700">Batal</button><button type="button" disabled={saving} onClick={save} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white disabled:opacity-50">{saving&&<Loader2 size={15} className="animate-spin"/>}Simpan</button></div></div></Modal>
  </div>;
}

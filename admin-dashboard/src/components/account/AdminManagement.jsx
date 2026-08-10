import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2, Mail, Plus, ShieldCheck, Trash2, UserPlus, UsersRound, X } from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";

const inputClass = "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

function formatDate(value) {
  if (!value) return "Belum tersedia";
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminManagement({ currentAdminId }) {
  const profiles = useLiveCollection("profiles") || [];
  const admins = useMemo(() => profiles.filter((item) => ["admin", "superadmin"].includes(item.role)).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)), [profiles]);
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [pageNotice, setPageNotice] = useState(null);
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });

  const close = () => { if (!saving) { setOpen(false); setNotice(null); } };
  const createAdmin = async (event) => {
    event.preventDefault();
    setNotice(null);
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    if (fullName.length < 3) return setNotice({ type: "error", text: "Nama lengkap minimal 3 karakter." });
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) return setNotice({ type: "error", text: "Password minimal 8 karakter serta mengandung huruf besar dan angka." });

    setSaving(true);
    try {
      // Klien terpisah mencegah sesi admin yang sedang membuka Dashboard terganti.
      const isolatedAuth = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { data, error } = await isolatedAuth.auth.signUp({
        email,
        password: form.password,
        options: { data: { full_name: fullName, phone: form.phone.trim(), role: "admin" } },
      });
      if (error) throw error;
      if (!data.user?.id) throw new Error("Supabase tidak mengembalikan ID akun baru.");

      const { error: roleError } = await supabase.rpc("admin_promote_new_account", {
        target_user_id: data.user.id,
        admin_full_name: fullName,
        admin_phone: form.phone.trim() || null,
      });
      if (roleError) throw new Error(`${roleError.message}. Pastikan SQL admin-account-management.sql sudah dijalankan.`);
      if (data.session) await isolatedAuth.auth.signOut();
      window.dispatchEvent(new CustomEvent("admin:refresh-data", { detail: { table: "profiles" } }));
      setForm({ fullName: "", email: "", password: "", phone: "" });
      setNotice({ type: "success", text: data.session ? "Akun admin berhasil dibuat dan sudah aktif." : "Akun admin berhasil dibuat. Pemilik akun perlu mengonfirmasi email sebelum login." });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "Akun admin gagal dibuat." });
    } finally { setSaving(false); }
  };

  const deleteAdmin = async () => {
    if (!deleteTarget || deleteTarget.id === currentAdminId) return;
    setDeleting(true); setPageNotice(null);
    const { data, error } = await supabase.rpc("admin_delete_admin_account", { target_user_id: deleteTarget.id });
    setDeleting(false);
    if (error) return setPageNotice({ type: "error", text: `${error.message}. Pastikan SQL admin-account-management.sql versi terbaru sudah dijalankan.` });
    setDeleteTarget(null);
    window.dispatchEvent(new CustomEvent("admin:refresh-data", { detail: { table: "profiles" } }));
    setPageNotice({ type: "success", text: `Akun ${deleteTarget.full_name || "administrator"} berhasil dihapus permanen dari Supabase.` });
    return data;
  };

  return <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600"><UsersRound size={20}/></span><div><h2 className="font-bold text-gray-900">Manajemen Administrator</h2><p className="text-xs text-gray-500">Kelola akun yang mempunyai akses khusus ke Dashboard.</p></div></div>
      <button type="button" onClick={() => { setOpen(true); setNotice(null); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-sm"><Plus size={15}/>Tambah Admin</button>
    </div>
    {pageNotice && <div role="alert" className={`mt-4 flex items-start justify-between gap-3 rounded-xl border p-3 text-xs ${pageNotice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><span className="flex items-start gap-2">{pageNotice.type === "success" ? <CheckCircle2 className="shrink-0" size={15}/> : <AlertTriangle className="shrink-0" size={15}/>} {pageNotice.text}</span><button type="button" onClick={() => setPageNotice(null)} aria-label="Tutup notifikasi"><X size={14}/></button></div>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {admins.map((item) => <article key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
        <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-900 text-xs font-bold text-white">{item.avatar_url ? <img src={item.avatar_url} alt={item.full_name || "Admin"} className="h-full w-full object-cover"/> : String(item.full_name || "A").slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><h3 className="truncate text-sm font-bold text-gray-900">{item.full_name || "Administrator"}</h3>{item.id === currentAdminId && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[8px] font-bold text-blue-700">ANDA</span>}</div><p className="mt-1 capitalize text-[10px] font-bold text-violet-600">{item.role}</p></div><ShieldCheck size={17} className="shrink-0 text-emerald-500"/></div>
        <div className="mt-3 border-t border-gray-100 pt-3 text-[10px] text-gray-500"><p>Dibuat: <strong className="text-gray-700">{formatDate(item.created_at)}</strong></p>{item.phone && <p className="mt-1">Telepon: <strong className="text-gray-700">{item.phone}</strong></p>}</div>
        {item.id !== currentAdminId ? <button type="button" onClick={() => { setDeleteTarget(item); setPageNotice(null); }} className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-[10px] font-bold text-red-600 transition hover:bg-red-50"><Trash2 size={13}/>Hapus Akun Admin</button> : <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-center text-[9px] font-semibold text-blue-600">Akun yang sedang digunakan dilindungi</div>}
      </article>)}
      {!admins.length && <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-xs text-gray-400">Data administrator belum dapat dimuat.</div>}
    </div>

    {open && <div className="fixed inset-0 z-[70] grid place-items-center bg-gray-950/55 p-3 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <form onSubmit={createAdmin} className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-5 py-4 backdrop-blur"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-primary"><UserPlus size={19}/></span><div><h2 className="font-bold text-gray-900">Tambah Akun Admin</h2><p className="text-[10px] text-gray-500">Akses khusus pengelola Dashboard</p></div></div><button type="button" onClick={close} className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100 text-gray-500"><X size={17}/></button></header>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-5 text-blue-700"><ShieldCheck className="mr-1 inline" size={14}/>Akun baru memperoleh akses pengelolaan admin. Gunakan email milik staf yang dipercaya.</div>
          {notice && <div role="alert" className={`flex gap-2 rounded-xl border p-3 text-xs ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{notice.type === "success" ? <CheckCircle2 size={15}/> : <ShieldCheck size={15}/>}<span>{notice.text}</span></div>}
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-gray-600">Nama lengkap<input required minLength={3} maxLength={80} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nama administrator" className={inputClass}/></label><label className="text-xs font-semibold text-gray-600">Nomor telepon (opsional)<input maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" className={inputClass}/></label></div>
          <label className="block text-xs font-semibold text-gray-600">Email admin<div className="relative"><Mail className="absolute left-3.5 top-1/2 mt-0.5 -translate-y-1/2 text-gray-400" size={15}/><input type="email" required autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@contoh.com" className={`${inputClass} pl-10`}/></div></label>
          <label className="block text-xs font-semibold text-gray-600">Password sementara<div className="relative"><input type={showPassword ? "text" : "password"} required minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 8 karakter" className={`${inputClass} pr-11`}/><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute bottom-0 right-0 grid h-11 w-11 place-items-center text-gray-400">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div><span className="mt-1.5 block text-[10px] font-normal text-gray-400">Wajib mengandung huruf besar dan angka.</span></label>
          <div className="rounded-xl bg-gray-50 p-3 text-[10px] leading-5 text-gray-500"><strong className="text-gray-700">Role:</strong> Admin Dashboard · dapat mengelola produk, pesanan, pelanggan, promo, dan pengaturan.</div>
        </div>
        <footer className="sticky bottom-0 flex gap-2 border-t bg-white/95 p-4 backdrop-blur sm:justify-end"><button type="button" onClick={close} disabled={saving} className="min-h-11 flex-1 rounded-xl border px-5 text-xs font-bold text-gray-600 sm:flex-none">Batal</button><button disabled={saving} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-white disabled:opacity-50 sm:flex-none">{saving ? <Loader2 className="animate-spin" size={15}/> : <UserPlus size={15}/>}Buat Akun Admin</button></footer>
      </form>
    </div>}
    {deleteTarget && <div className="fixed inset-0 z-[80] grid place-items-center bg-gray-950/60 p-3 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && !deleting && setDeleteTarget(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="delete-admin-title" className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle size={22}/></span>
        <h2 id="delete-admin-title" className="mt-4 text-lg font-bold text-gray-900">Hapus akun administrator?</h2>
        <p className="mt-2 text-xs leading-5 text-gray-500">Akun <strong className="text-gray-800">{deleteTarget.full_name || "Administrator"}</strong> akan dihapus permanen dari Supabase Auth. Admin tersebut akan kehilangan akses dan semua sesi perangkatnya akan dihentikan.</p>
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-[10px] leading-5 text-red-700"><strong>Tindakan permanen:</strong> akun yang telah dihapus tidak dapat dipulihkan. Untuk menggunakannya kembali, Anda harus membuat akun admin baru.</div>
        <div className="mt-5 flex gap-2"><button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="min-h-11 flex-1 rounded-xl border text-xs font-bold text-gray-600 disabled:opacity-50">Batal</button><button type="button" disabled={deleting} onClick={deleteAdmin} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-xs font-bold text-white disabled:opacity-50">{deleting ? <Loader2 className="animate-spin" size={15}/> : <Trash2 size={15}/>}Hapus Permanen</button></div>
      </section>
    </div>}
  </section>;
}

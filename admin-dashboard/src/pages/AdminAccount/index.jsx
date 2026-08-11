import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Check, CheckCircle2, Clipboard, Clock3, Eye, EyeOff,
  Camera, ImagePlus, KeyRound, Loader2, LockKeyhole, Mail, MonitorSmartphone, ShieldCheck, Trash2, UserRound,
} from "lucide-react";
import { useAdminAuth } from "../../hooks/useAdminAuth.js";
import { supabase } from "../../supabase/client.js";
import { getPublicUrl, uploadFile } from "../../supabase/storage.js";
import AdminDeviceSessions from "../../components/account/AdminDeviceSessions.jsx";
import AdminManagement from "../../components/account/AdminManagement.jsx";
import { currentDeviceId } from "../../hooks/useAdminDeviceSessions.js";

const fieldClass = "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-gray-50 disabled:text-gray-400";

function dateTime(value) {
  if (!value) return "Belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum tersedia";
  return date.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
}

function Notice({ notice }) {
  if (!notice) return null;
  const success = notice.type === "success";
  return <div role="alert" className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
    {success ? <CheckCircle2 className="mt-0.5 shrink-0" size={15}/> : <ShieldCheck className="mt-0.5 shrink-0" size={15}/>}<span>{notice.text}</span>
  </div>;
}

export default function AdminAccount() {
  const { admin } = useAdminAuth();
  const initialName = admin?.user_metadata?.full_name || "Admin Dimsum";
  const [fullName, setFullName] = useState(initialName);
  const [profileNotice, setProfileNotice] = useState(null);
  const [securityNotice, setSecurityNotice] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(admin?.user_metadata?.avatar_url || "");
  const [savingPassword, setSavingPassword] = useState(false);
  const [endingSessions, setEndingSessions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [passwords, setPasswords] = useState({ password: "", confirmation: "" });

  const role = admin?.adminRole || admin?.app_metadata?.role || admin?.user_metadata?.role || "admin";
  const initials = initialName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "AD";
  const strength = useMemo(() => {
    const value = passwords.password;
    return [value.length >= 8, /[a-z]/.test(value) && /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  }, [passwords.password]);
  const strengthLabel = ["Belum diisi", "Lemah", "Cukup", "Kuat", "Sangat kuat"][strength];

  useEffect(() => {
    setFullName(admin?.user_metadata?.full_name || "Admin Dimsum");
    setAvatarUrl(admin?.user_metadata?.avatar_url || "");
  }, [admin?.user_metadata?.full_name, admin?.user_metadata?.avatar_url]);

  const uploadAvatar = async (file) => {
    if (!file) return;
    setSavingAvatar(true); setProfileNotice(null);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `admin-avatars/${admin.id}-${Date.now()}.${extension}`;
      await uploadFile("product-images", path, file);
      const publicUrl = `${getPublicUrl("product-images", path)}?v=${Date.now()}`;
      const { error } = await supabase.auth.updateUser({ data: { ...admin?.user_metadata, avatar_url: publicUrl } });
      if (error) throw error;
      setAvatarUrl(publicUrl);
      setProfileNotice({ type: "success", text: "Foto profil berhasil diunggah dan diperbarui di seluruh Dashboard." });
    } catch (reason) { setProfileNotice({ type: "error", text: reason.message || "Foto profil gagal diunggah." }); }
    finally { setSavingAvatar(false); }
  };

  const removeAvatar = async () => {
    if (!confirm("Hapus foto profil admin? Tampilan akan kembali menggunakan inisial nama.")) return;
    setSavingAvatar(true); setProfileNotice(null);
    const { error } = await supabase.auth.updateUser({ data: { ...admin?.user_metadata, avatar_url: null } });
    setSavingAvatar(false);
    if (error) setProfileNotice({ type: "error", text: error.message });
    else { setAvatarUrl(""); setProfileNotice({ type: "success", text: "Foto profil berhasil dihapus." }); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const normalizedName = fullName.trim();
    setProfileNotice(null);
    if (normalizedName.length < 3) return setProfileNotice({ type: "error", text: "Nama admin minimal 3 karakter." });
    if (normalizedName.length > 80) return setProfileNotice({ type: "error", text: "Nama admin maksimal 80 karakter." });
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({ data: { ...admin?.user_metadata, full_name: normalizedName } });
    setSavingProfile(false);
    setProfileNotice(error ? { type: "error", text: error.message } : { type: "success", text: "Profil admin berhasil diperbarui." });
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setSecurityNotice(null);
    if (passwords.password.length < 8) return setSecurityNotice({ type: "error", text: "Password minimal 8 karakter." });
    if (strength < 3) return setSecurityNotice({ type: "error", text: "Gunakan kombinasi huruf besar, huruf kecil, angka, atau simbol." });
    if (passwords.password !== passwords.confirmation) return setSecurityNotice({ type: "error", text: "Konfirmasi password belum sama." });
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.password });
    setSavingPassword(false);
    if (error) return setSecurityNotice({ type: "error", text: error.message });
    setPasswords({ password: "", confirmation: "" });
    setSecurityNotice({ type: "success", text: "Password berhasil diperbarui. Gunakan password baru pada login berikutnya." });
  };

  const copyId = async () => {
    try { await navigator.clipboard.writeText(admin?.id || ""); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setProfileNotice({ type: "error", text: "ID akun tidak dapat disalin oleh browser." }); }
  };

  const endOtherSessions = async () => {
    if (!confirm("Keluar dari semua perangkat lain yang memakai akun ini?")) return;
    setEndingSessions(true); setSecurityNotice(null);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (!error && admin?.id) await supabase.from("admin_sessions").update({ ended_at: new Date().toISOString() }).eq("admin_id", admin.id).neq("device_id", currentDeviceId());
    setEndingSessions(false);
    setSecurityNotice(error ? { type: "error", text: error.message } : { type: "success", text: "Semua sesi di perangkat lain telah diakhiri." });
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-xl font-bold text-gray-900">Akun Admin</h1><p className="mt-1 text-sm text-gray-500">Kelola identitas, akses, dan keamanan akun Dashboard.</p></div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Akun aktif</span>
    </div>

    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-24 bg-gradient-to-r from-orange-500 via-primary to-amber-400"/>
      <div className="px-5 pb-5 sm:px-7">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4"><div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-gray-900 text-white shadow-sm">{avatarUrl ? <img src={avatarUrl} alt={`Foto profil ${initialName}`} className="h-full w-full object-cover"/> : <span className="grid h-full w-full place-items-center text-xl font-bold">{initials}</span>}{savingAvatar && <span className="absolute inset-0 grid place-items-center bg-black/55"><Loader2 className="animate-spin" size={20}/></span>}<span className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-lg bg-black/60"><Camera size={12}/></span></div><div className="pb-1"><h2 className="font-bold text-gray-900 sm:text-lg">{initialName}</h2><p className="text-xs text-gray-500">{admin?.email || "Email tidak tersedia"}</p></div></div>
          <span className="mb-1 inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold capitalize text-primary"><ShieldCheck size={15}/>{role}</span>
        </div>
      </div>
    </section>

    <div className="grid gap-5 xl:grid-cols-3">
      <div className="space-y-5 xl:col-span-2">
        <form onSubmit={saveProfile} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-primary"><UserRound size={19}/></span><div><h2 className="font-bold text-gray-900">Informasi profil</h2><p className="text-xs text-gray-500">Informasi yang tampil pada Dashboard.</p></div></div>
          <Notice notice={profileNotice}/>
          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-900 text-white shadow-sm">{avatarUrl ? <img src={avatarUrl} alt="Foto profil admin" className="h-full w-full object-cover"/> : <span className="grid h-full place-items-center text-lg font-bold">{initials}</span>}</div><div className="min-w-0 flex-1"><h3 className="text-xs font-bold text-gray-800">Foto profil administrator</h3><p className="mt-1 text-[10px] leading-4 text-gray-500">Gunakan foto persegi JPG, PNG, atau WebP. Ukuran maksimal 5 MB. Foto tersimpan aman di Supabase Storage.</p><div className="mt-3 flex flex-wrap gap-2"><label className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 text-[10px] font-bold text-white ${savingAvatar ? "pointer-events-none opacity-50" : ""}`}>{savingAvatar ? <Loader2 size={13} className="animate-spin"/> : <ImagePlus size={13}/>} {avatarUrl ? "Ganti Foto" : "Unggah Foto"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={savingAvatar} onChange={(event) => { uploadAvatar(event.target.files?.[0]); event.target.value = ""; }}/></label>{avatarUrl && <button type="button" disabled={savingAvatar} onClick={removeAvatar} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-[10px] font-bold text-red-600 disabled:opacity-50"><Trash2 size={13}/>Hapus Foto</button>}</div></div></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600">Nama lengkap<input required minLength={3} maxLength={80} value={fullName} onChange={(event) => setFullName(event.target.value)} className={fieldClass}/></label>
            <label className="text-xs font-semibold text-gray-600">Email akun<div className="relative"><Mail className="absolute left-3.5 top-1/2 mt-0.5 -translate-y-1/2 text-gray-400" size={16}/><input disabled value={admin?.email || ""} className={`${fieldClass} pl-10`}/></div></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-[11px] text-gray-400">Email dikelola melalui autentikasi Supabase.</p><button disabled={savingProfile || fullName.trim() === initialName} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{savingProfile ? <Loader2 className="animate-spin" size={15}/> : <Check size={15}/>}Simpan Profil</button></div>
        </form>

        <form onSubmit={savePassword} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><KeyRound size={19}/></span><div><h2 className="font-bold text-gray-900">Ubah password</h2><p className="text-xs text-gray-500">Buat password unik yang tidak digunakan di layanan lain.</p></div></div>
          <Notice notice={securityNotice}/>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-gray-600">Password baru<div className="relative"><input type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} value={passwords.password} onChange={(event) => setPasswords({ ...passwords, password: event.target.value })} className={`${fieldClass} pr-11`}/><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute bottom-0 right-0 grid h-11 w-11 place-items-center text-gray-400" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
            <label className="text-xs font-semibold text-gray-600">Konfirmasi password<div className="relative"><input type={showConfirmation ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} value={passwords.confirmation} onChange={(event) => setPasswords({ ...passwords, confirmation: event.target.value })} className={`${fieldClass} pr-11`}/><button type="button" onClick={() => setShowConfirmation((value) => !value)} className="absolute bottom-0 right-0 grid h-11 w-11 place-items-center text-gray-400" aria-label={showConfirmation ? "Sembunyikan konfirmasi" : "Tampilkan konfirmasi"}>{showConfirmation ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
          </div>
          <div className="mt-3"><div className="flex gap-1">{[1, 2, 3, 4].map((step) => <span key={step} className={`h-1.5 flex-1 rounded-full ${strength >= step ? (strength < 3 ? "bg-amber-400" : "bg-emerald-500") : "bg-gray-100"}`}/>)}</div><p className="mt-1.5 text-[11px] text-gray-500">Kekuatan password: <strong>{strengthLabel}</strong></p></div>
          <button disabled={savingPassword} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-xs font-bold text-white disabled:opacity-50 sm:w-auto sm:px-5">{savingPassword ? <Loader2 className="animate-spin" size={15}/> : <LockKeyhole size={15}/>}Perbarui Password</button>
        </form>
      </div>

      <aside className="space-y-5">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-gray-900"><ShieldCheck className="text-emerald-600" size={18}/>Detail akun</h2><div className="mt-4 space-y-4 text-xs">
          <div className="flex gap-3"><CalendarDays className="shrink-0 text-gray-400" size={17}/><div><p className="text-gray-400">Akun dibuat</p><p className="mt-0.5 font-semibold text-gray-700">{dateTime(admin?.created_at)}</p></div></div>
          <div className="flex gap-3"><Clock3 className="shrink-0 text-gray-400" size={17}/><div><p className="text-gray-400">Login terakhir</p><p className="mt-0.5 font-semibold text-gray-700">{dateTime(admin?.last_sign_in_at)}</p></div></div>
          <div><p className="text-gray-400">ID akun</p><button type="button" onClick={copyId} className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-2.5 text-left font-mono text-[10px] text-gray-600"><span className="truncate">{admin?.id || "-"}</span>{copied ? <Check className="shrink-0 text-emerald-500" size={14}/> : <Clipboard className="shrink-0" size={14}/>}</button></div>
        </div></section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-gray-900"><MonitorSmartphone className="text-blue-600" size={18}/>Keamanan sesi</h2><p className="mt-2 text-xs leading-5 text-gray-500">Jika akun pernah dibuka pada perangkat yang tidak dikenal, akhiri semua sesi lainnya.</p><button type="button" onClick={endOtherSessions} disabled={endingSessions} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 disabled:opacity-50">{endingSessions && <Loader2 className="animate-spin" size={14}/>}Keluar dari perangkat lain</button></section>

        <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5"><h3 className="text-sm font-bold text-amber-800">Tips keamanan</h3><ul className="mt-2 space-y-2 text-xs leading-5 text-amber-700"><li>• Jangan bagikan password admin.</li><li>• Gunakan password unik yang kuat untuk akun admin.</li><li>• Keluar setelah memakai perangkat bersama.</li></ul></section>
      </aside>
    </div>
    <AdminManagement currentAdminId={admin?.id} canDelete={role === "superadmin"}/>
    <AdminDeviceSessions adminId={admin?.id}/>
  </div>;
}

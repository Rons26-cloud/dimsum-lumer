import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import {
  enrollAdminTotp,
  getAdminMfaStatus,
  listAdminMfaFactors,
  signOutAdmin,
  verifyAdminTotp,
} from "../services/authService.js";
import { useAdminAuth } from "../hooks/useAdminAuth.js";

export default function MfaAdmin() {
  const { admin, loading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [factor, setFactor] = useState(null);
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!admin) return () => { active = false; };
    (async () => {
      const status = await getAdminMfaStatus();
      if (status.verified) return navigate("/", { replace: true });
      const factors = await listAdminMfaFactors();
      if (!active) return;
      if (factors[0]) setFactor(factors[0]);
      else {
        const enrollment = await enrollAdminTotp();
        if (!active) return;
        setFactor(enrollment);
        setQr(enrollment?.totp?.qr_code || "");
        setSecret(enrollment?.totp?.secret || "");
      }
    })().catch((requestError) => active && setError(requestError.message || "MFA gagal disiapkan."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [admin?.id, navigate]);

  if (authLoading) return null;
  if (!admin) return <Navigate to="/login" replace />;

  const verify = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await verifyAdminTotp(factor?.id, code);
      navigate("/", { replace: true });
      window.location.reload();
    } catch (requestError) {
      setError(requestError.message || "Kode autentikator tidak valid.");
    } finally { setSaving(false); }
  };

  return <main className="min-h-dvh bg-slate-950 px-4 py-10 text-slate-900 sm:grid sm:place-items-center">
    <section className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
      <header className="bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><ShieldCheck size={25}/></span>
        <h1 className="mt-4 text-xl font-bold">Verifikasi keamanan admin</h1>
        <p className="mt-2 text-xs leading-5 text-slate-300">Dashboard produksi mewajibkan autentikasi dua langkah pada setiap sesi baru.</p>
      </header>
      <form onSubmit={verify} className="space-y-5 p-6">
        {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/>Menyiapkan autentikator...</div> : <>
          {qr && <div className="space-y-3 text-center">
            <p className="text-xs leading-5 text-slate-600">Pindai QR berikut menggunakan Google Authenticator, Microsoft Authenticator, atau aplikasi TOTP lain.</p>
            <img src={qr} alt="QR autentikasi dua langkah" className="mx-auto h-48 w-48 rounded-2xl border bg-white p-2"/>
            <div className="rounded-xl bg-slate-50 p-3 text-left"><p className="text-[10px] font-semibold text-slate-500">Kode pengaturan manual</p><code className="mt-1 block break-all text-xs font-bold text-slate-800">{secret}</code></div>
          </div>}
          {!qr && <div className="flex gap-3 rounded-2xl bg-blue-50 p-4 text-xs leading-5 text-blue-800"><KeyRound className="shrink-0" size={18}/>Masukkan kode dari aplikasi autentikator yang telah terhubung.</div>}
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <label className="block text-xs font-bold text-slate-700">Kode autentikator 6 digit
            <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-2xl border px-4 py-3 text-center text-xl font-bold tracking-[0.4em] outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" placeholder="000000"/>
          </label>
          <button disabled={saving || !factor} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={17}/> : <ShieldCheck size={17}/>}Verifikasi dan masuk</button>
        </>}
        <button type="button" onClick={async () => { await signOutAdmin(); navigate("/login", { replace: true }); }} className="inline-flex w-full items-center justify-center gap-2 text-xs font-semibold text-slate-500"><LogOut size={14}/>Keluar dari akun</button>
      </form>
    </section>
  </main>;
}

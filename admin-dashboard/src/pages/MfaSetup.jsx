import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeTotpCode, signOutFromMfa, startTotpEnrollment, verifyTotpFactor } from "../services/mfaService.js";

export default function MfaSetup() {
  const navigate = useNavigate();
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    startTotpEnrollment()
      .then((result) => {
        if (!active) return;
        if (result.alreadyVerified) return navigate("/", { replace: true });
        setFactorId(result.factorId);
        setQrCode(result.qrCode);
      })
      .catch((reason) => {
        if (!active) return;
        if (reason.code === "FACTOR_EXISTS") return navigate("/mfa/verify", { replace: true });
        setError(reason.message || "Enrollment MFA gagal.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; setQrCode(""); };
  }, [navigate]);

  const activate = async (event) => {
    event.preventDefault(); setError(""); setLoading(true);
    try { await verifyTotpFactor(factorId, code); setQrCode(""); navigate("/", { replace: true }); }
    catch (reason) { setError(reason.message || "MFA gagal diaktifkan."); }
    finally { setLoading(false); }
  };

  return <form onSubmit={activate} className="space-y-4">
    <div className="text-center"><h1 className="text-lg font-bold text-gray-800">Setup MFA</h1><p className="mt-1 text-xs leading-5 text-gray-500">Pindai QR dengan Google Authenticator, Microsoft Authenticator, Authy, atau aplikasi TOTP lain.</p></div>
    {loading && !qrCode && !error && <p className="text-center text-sm text-gray-500">Membuat factor TOTP...</p>}
    {qrCode && <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center"><img src={qrCode} alt="QR setup MFA Dimsum Lumer" className="mx-auto h-48 w-48"/><ol className="mt-3 space-y-1 text-left text-xs leading-5 text-gray-600"><li>1. Buka aplikasi Authenticator.</li><li>2. Pilih tambah akun dan pindai QR.</li><li>3. Masukkan kode enam digit yang tampil.</li></ol></div>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">{error}</p>}
    <input value={code} onChange={(event)=>setCode(normalizeTotpCode(event.target.value))} inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" placeholder="Kode 6 digit" aria-label="Kode Authenticator" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-xl tracking-[0.35em] outline-none focus:ring-2 focus:ring-primary/30"/>
    <button type="submit" disabled={loading || !qrCode || code.length !== 6} className="w-full rounded-xl bg-primary py-2.5 font-semibold text-white disabled:opacity-50">{loading ? "Mengaktifkan..." : "Aktifkan MFA"}</button>
    <button type="button" onClick={async()=>{setQrCode("");await signOutFromMfa();navigate("/login",{replace:true});}} className="w-full text-xs text-gray-500">Batalkan dan keluar</button>
  </form>;
}

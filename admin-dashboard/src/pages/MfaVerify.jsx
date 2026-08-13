import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inspectAdminMfa, normalizeTotpCode, signOutFromMfa, verifyTotpFactor } from "../services/mfaService.js";

export default function MfaVerify() {
  const navigate = useNavigate();
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    inspectAdminMfa().then(({ assurance, verifiedTotp }) => {
      if (!active) return;
      if (assurance?.currentLevel === "aal2") return navigate("/", { replace: true });
      if (!verifiedTotp) return navigate("/mfa/setup", { replace: true });
      setFactorId(verifiedTotp.id);
    }).catch((reason)=>active && setError(reason.message || "Factor MFA tidak dapat dimuat."))
      .finally(()=>active && setLoading(false));
    return ()=>{active=false;};
  }, [navigate]);

  const verify = async (event) => {
    event.preventDefault(); setError(""); setLoading(true);
    try { await verifyTotpFactor(factorId, code); navigate("/", { replace: true }); }
    catch (reason) { setError(reason.message || "Verifikasi MFA gagal."); setCode(""); }
    finally { setLoading(false); }
  };

  return <form onSubmit={verify} className="space-y-4">
    <div className="text-center"><h1 className="text-lg font-bold text-gray-800">Verifikasi MFA</h1><p className="mt-1 text-xs leading-5 text-gray-500">Masukkan kode enam digit terbaru dari aplikasi Authenticator. QR tidak diperlukan untuk login berikutnya.</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">{error}</p>}
    <input value={code} onChange={(event)=>setCode(normalizeTotpCode(event.target.value))} inputMode="numeric" autoComplete="one-time-code" autoFocus required pattern="[0-9]{6}" placeholder="Kode 6 digit" aria-label="Kode Authenticator" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-xl tracking-[0.35em] outline-none focus:ring-2 focus:ring-primary/30"/>
    <button type="submit" disabled={loading || !factorId || code.length !== 6} className="w-full rounded-xl bg-primary py-2.5 font-semibold text-white disabled:opacity-50">{loading ? "Memverifikasi..." : "Verifikasi"}</button>
    <button type="button" onClick={async()=>{await signOutFromMfa();navigate("/login",{replace:true});}} className="w-full text-xs text-gray-500">Kembali ke login</button>
  </form>;
}

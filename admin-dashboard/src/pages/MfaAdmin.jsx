import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { inspectAdminMfa, signOutFromMfa } from "../services/mfaService.js";

export default function MfaAdmin() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, target: "", error: "" });

  useEffect(() => {
    let active = true;
    inspectAdminMfa()
      .then(({ assurance, verifiedTotp }) => {
        if (!active) return;
        if (assurance?.currentLevel === "aal2") setState({ loading: false, target: "/", error: "" });
        else setState({ loading: false, target: verifiedTotp ? "/mfa/verify" : "/mfa/setup", error: "" });
      })
      .catch((error) => active && setState({ loading: false, target: "", error: error.message || "Status MFA tidak dapat diperiksa." }));
    return () => { active = false; };
  }, []);

  if (state.target) return <Navigate to={state.target} replace />;
  if (state.loading) return <p className="text-center text-sm text-gray-500">Memeriksa keamanan akun...</p>;
  return <div className="space-y-4 text-center"><h1 className="text-lg font-bold text-gray-800">MFA belum dapat diperiksa</h1><p role="alert" className="text-sm text-red-600">{state.error}</p><button type="button" onClick={()=>window.location.reload()} className="w-full rounded-xl bg-primary py-2.5 font-semibold text-white">Coba Lagi</button><button type="button" onClick={async()=>{await signOutFromMfa();navigate("/login",{replace:true});}} className="text-xs text-gray-500">Keluar dari sesi</button></div>;
}

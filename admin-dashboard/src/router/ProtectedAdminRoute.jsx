import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth.js";
import Loading from "../components/ui/Loading.jsx";
import { getAdminMfaStatus } from "../services/authService.js";

export default function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();
  const [mfa, setMfa] = useState({ loading: true, verified: false });

  useEffect(() => {
    let active = true;
    if (!admin) {
      setMfa({ loading: false, verified: false });
      return () => { active = false; };
    }
    getAdminMfaStatus()
      .then((status) => active && setMfa({ loading: false, verified: status.verified }))
      .catch(() => active && setMfa({ loading: false, verified: false }));
    return () => { active = false; };
  }, [admin?.id]);

  if (loading || mfa.loading) return <Loading fullscreen />;
  if (!admin) return <Navigate to="/login" replace />;
  if (!mfa.verified && location.pathname !== "/mfa") return <Navigate to="/mfa" replace />;
  return children;
}

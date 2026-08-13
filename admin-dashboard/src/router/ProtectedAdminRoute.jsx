import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth.js";
import Loading from "../components/ui/Loading.jsx";

export default function ProtectedAdminRoute({ children }) {
  const { admin, loading, requiresMfa } = useAdminAuth();
  if (loading) return <Loading fullscreen />;
  if (requiresMfa) return <Navigate to="/mfa" replace />;
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}

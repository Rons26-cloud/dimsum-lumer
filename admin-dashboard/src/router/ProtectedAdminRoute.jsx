import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth.js";
import Loading from "../components/ui/Loading.jsx";

export default function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return <Loading fullscreen />;
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}

import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth.js";

export default function PermissionRoute({ children, allow = ["admin", "superadmin"] }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  const role = admin?.adminRole || admin?.user_metadata?.role || admin?.app_metadata?.role;
  if (!allow.includes(role)) return <Navigate to="/" replace />;
  return children;
}

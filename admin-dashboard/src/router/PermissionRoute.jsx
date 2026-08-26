import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth.js";

export default function PermissionRoute({ children, allow = ["admin", "superadmin"] }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  // adminRole is resolved from trusted app_metadata or the protected profiles
  // row. Never authorize from user_metadata because users can edit it.
  const role = admin?.adminRole;
  if (!allow.includes(role)) return <Navigate to="/" replace />;
  return children;
}

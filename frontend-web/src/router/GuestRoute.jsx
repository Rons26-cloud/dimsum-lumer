import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Loading from "../components/ui/Loading.jsx";

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading fullscreen />;
  if (user) return <Navigate to="/" replace />;

  return children;
}

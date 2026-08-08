import { useEffect, useState } from "react";
import { getCurrentAdminSession, onAdminAuthStateChange } from "../supabase/auth.js";

export function useAdminAuth() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCurrentAdminSession()
      .then((session) => mounted && setAdmin(session?.user ?? null))
      .finally(() => mounted && setLoading(false));

    const unsubscribe = onAdminAuthStateChange((_e, session) => setAdmin(session?.user ?? null));
    return () => { mounted = false; unsubscribe(); };
  }, []);

  return { admin, loading, isAuthenticated: !!admin };
}

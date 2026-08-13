import { useEffect, useState } from "react";
import { getAdminAuthState, onAdminAuthStateChange } from "../supabase/auth.js";

export function useAdminAuth() {
  const [admin, setAdmin] = useState(null);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const applyState = (state) => {
      if (!mounted) return;
      setAdmin(state?.admin ?? null);
      setRequiresMfa(Boolean(state?.requiresMfa));
    };

    getAdminAuthState()
      .then(applyState)
      .finally(() => mounted && setLoading(false));

    const unsubscribe = onAdminAuthStateChange((_event, state) => {
      applyState(state);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  return { admin, loading, requiresMfa, isAuthenticated: !!admin };
}

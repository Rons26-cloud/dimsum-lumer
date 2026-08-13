import { useState, useEffect } from "react";
import { supabase } from "../supabase/client.js"; // <-- Pastikan import ini ada!


export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};


export const signInWithGoogle = async () => {
  const isEmbedded = window.self !== window.top;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/profil`,
      skipBrowserRedirect: isEmbedded,
    },
  });
  if (error) throw error;
  if (isEmbedded && data?.url) window.top.location.assign(data.url);
  return data;
};


export const signUp = async ({ email, password, name, phone }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone: phone,
      },
    },
  });
  if (error) throw error;
  return data;
};


export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};


export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession()
      .then(({ data }) => { if (isMounted) setUser(data?.session?.user?.is_anonymous ? null : (data?.session?.user ?? null)); })
      .catch((error) => {
        console.warn("Sesi lokal tidak dapat dipulihkan:", error?.message || error);
        if (isMounted) setUser(null);
      })
      .finally(() => { if (isMounted) setLoading(false); });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user?.is_anonymous ? null : (session?.user ?? null));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}

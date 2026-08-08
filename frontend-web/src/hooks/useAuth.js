import { useState, useEffect } from "react";
import { supabase } from "../supabase/client.js"; // <-- Pastikan import ini ada!

/**
 * Fungsi untuk Masuk (Login) dengan Email & Password
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/**
 * Fungsi untuk Masuk dengan Google (OAuth)
 */
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/profil`,
    },
  });
  if (error) throw error;
  return data;
};

/**
 * Fungsi untuk Daftar (Register)
 */
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

/**
 * Fungsi untuk Keluar (Logout)
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Custom Hook useAuth
 * Mengelola status sesi pengguna secara global di aplikasi web.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Ambil sesi awal pengguna saat aplikasi dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Mendengarkan perubahan status autentikasi (login/logout) secara real-time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
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
import { supabase } from "./client.js";

// Daftar/Registrasi
export const signUp = async ({ email, password, options = {} }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options,
  });
  if (error) throw error;
  return data;
};

// Masuk dengan Email & Password
export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

// Masuk dengan Google OAuth
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

// Keluar (Sign Out)
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Mendapatkan Sesi Saat Ini
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

// Listener Perubahan Status Auth
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};
import { supabase } from "../supabase/client.js";

export async function signUp({ email, password, fullName, phone, options = {} }) {
  const metadata = options.data || { full_name: fullName, phone };
  const { data, error } = await supabase.auth.signUp({ email, password, options: { ...options, data: metadata } });
  if (error) throw error;
  if (data.user?.identities?.length === 0) throw new Error("Email sudah terdaftar. Silakan masuk.");
  // Profile dibuat atomik oleh trigger auth.users di database. Client tidak
  // menulis role/point agar signup web dan APK menggunakan alur yang sama.
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo:`${window.location.origin}/profil` } });
  if (error) throw error;
  return data;
}

export async function requestPasswordReset(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo:`${window.location.origin}/reset-password` });
  if (error) throw error;
  return data;
}

export async function updatePassword(password) {
  const { data,error }=await supabase.auth.updateUser({password});
  if(error)throw error;
  return data;
}

export async function verifyPasswordRecoveryOtp(email,token) {
  const {data,error}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:token.trim(),type:"recovery"});
  if(error)throw error;
  return data;
}

export async function signOut() { const { error }=await supabase.auth.signOut();if(error)throw error; }
export async function getCurrentSession() { const {data,error}=await supabase.auth.getSession();if(error)throw error;return data.session; }
export const onAuthStateChange=(callback)=>supabase.auth.onAuthStateChange((event,session)=>callback(event,session));

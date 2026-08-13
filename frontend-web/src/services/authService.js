import { supabase } from "../supabase/client.js";

export async function signUp({ email, password, fullName, phone, options = {} }) {
  const metadata = {
    ...(options.data || {}),
    full_name: fullName,
    phone,
    account_type: "user",
  };
  const { data, error } = await supabase.auth.signUp({ email, password, options: { ...options, data: metadata } });
  if (error) throw error;
  if (data.user?.identities?.length === 0) throw new Error("Email sudah terdaftar. Silakan masuk.");
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  if (window.DimsumLumerApp?.postMessage) {
    window.DimsumLumerApp.postMessage(JSON.stringify({ type: "google_sign_in" }));
    return { native: true };
  }
  const redirectTo = new URL("/profil", window.location.origin).toString();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
  return data;
}

// Dipanggil shell APK setelah OAuth native berhasil. Session tetap divalidasi
// oleh Supabase; frontend tidak menerima atau menyimpan kredensial Google.
window.addEventListener("dimsum-lumer-auth", async (event) => {
  const accessToken = event?.detail?.accessToken;
  const refreshToken = event?.detail?.refreshToken;
  if (!accessToken || !refreshToken) return;
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!error) window.location.replace("/profil?source=apk");
});

export async function requestPasswordReset(email) {
  const redirectTo = new URL("/reset-password", window.location.origin).toString();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
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

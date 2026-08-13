import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidSupabaseUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /\.supabase\.co$/i.test(url.hostname);
  } catch {
    return false;
  }
}

function jwtRole(key) {
  try {
    const payload = key.split(".")[1];
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized)).role || "";
  } catch {
    return "";
  }
}

if (!isValidSupabaseUrl(supabaseUrl) || !supabaseAnonKey) {
  throw new Error("Konfigurasi Supabase publik dashboard tidak valid.");
}
if (jwtRole(supabaseAnonKey) === "service_role") {
  throw new Error("VITE_SUPABASE_ANON_KEY tidak boleh berisi service-role key.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

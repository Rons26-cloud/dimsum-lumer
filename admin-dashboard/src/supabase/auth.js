import { supabase } from "./client.js";

export async function signInAdmin({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");
  if (!normalizedEmail || !normalizedPassword) throw new Error("Email dan password wajib diisi.");
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Format email tidak valid.");
  if (normalizedPassword.length > 128) throw new Error("Password tidak valid.");
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: normalizedPassword });
  if (error) throw error;

  const admin = await resolveAdminUser(data.user);
  if (!admin) {
    await supabase.auth.signOut();
    throw new Error("Akun ini tidak memiliki akses admin.");
  }
  return { ...data, user: admin };
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentAdminSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) return null;
  const admin = await resolveAdminUser(data.session.user);
  return admin ? { ...data.session, user: admin } : null;
}

export async function resolveAdminUser(user) {
  if (!user) return null;
  const trustedRole = user.app_metadata?.role;
  if (["admin", "superadmin"].includes(trustedRole)) return { ...user, adminRole: trustedRole };
  const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (error || !["admin", "superadmin"].includes(data?.role)) return null;
  return { ...user, adminRole: data.role };
}

export function onAdminAuthStateChange(callback) {
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    window.setTimeout(async () => {
      const admin = await resolveAdminUser(session?.user);
      callback(event, admin && session ? { ...session, user: admin } : null);
    }, 0);
  });
  return () => listener.subscription.unsubscribe();
}

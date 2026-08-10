import { supabase } from "./client.js";

let pendingTotpEnrollment = null;

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

export async function getAdminMfaStatus() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return {
    currentLevel: data?.currentLevel || "aal1",
    nextLevel: data?.nextLevel || "aal1",
    verified: data?.currentLevel === "aal2",
    enrolled: data?.nextLevel === "aal2",
  };
}

export async function listAdminMfaFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return (data?.totp || []).filter((factor) => factor.status === "verified");
}

export async function enrollAdminTotp() {
  if (!pendingTotpEnrollment) {
    pendingTotpEnrollment = supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Dashboard Admin ${new Date().toISOString().slice(0, 10)}`,
    }).then(({ data, error }) => {
      if (error) throw error;
      return data;
    }).catch((error) => {
      pendingTotpEnrollment = null;
      throw error;
    });
  }
  return pendingTotpEnrollment;
}

export async function verifyAdminTotp(factorId, code) {
  const normalizedCode = String(code || "").replace(/\D/g, "");
  if (!factorId || normalizedCode.length !== 6) throw new Error("Masukkan kode autentikator 6 digit.");
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: normalizedCode });
  if (error) throw error;
  return data;
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

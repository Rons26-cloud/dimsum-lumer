import { supabase } from "../supabase/client.js";
import { resolveAdminUser } from "../supabase/auth.js";

const enrollmentRequests = new Map();

export class MfaFlowError extends Error {
  constructor(code, message, cause) {
    super(message, cause ? { cause } : undefined);
    this.name = "MfaFlowError";
    this.code = code;
  }
}

function authError(code, fallback, error) {
  const value = error?.code || error?.message || "";
  if (/session.*(missing|not found)|invalid.*jwt|jwt.*expired/i.test(value)) {
    return new MfaFlowError("SESSION_MISSING", "Sesi admin tidak tersedia atau sudah berakhir. Silakan masuk kembali.", error);
  }
  if (/mfa_factor_name_conflict/i.test(value)) {
    return new MfaFlowError("FACTOR_CONFLICT", "Factor MFA dengan nama yang sama sudah ada. Muat ulang untuk memakai factor yang tersedia.", error);
  }
  if (/mfa_verified_factor_exists/i.test(value)) {
    return new MfaFlowError("FACTOR_EXISTS", "Factor TOTP sudah aktif. Lanjutkan ke verifikasi MFA.", error);
  }
  if (/mfa.*disabled|verification.*disabled/i.test(value)) {
    return new MfaFlowError("MFA_DISABLED", "MFA TOTP belum diaktifkan pada konfigurasi Supabase Auth.", error);
  }
  if (/expired/i.test(value)) {
    return new MfaFlowError("CODE_EXPIRED", "Kode atau challenge sudah kedaluwarsa. Gunakan kode terbaru lalu coba kembali.", error);
  }
  if (/invalid.*(code|totp)|challenge.*invalid|verification.*failed/i.test(value)) {
    return new MfaFlowError("CODE_INVALID", "Kode Authenticator salah. Pastikan waktu perangkat akurat dan gunakan kode terbaru.", error);
  }
  return new MfaFlowError(code, fallback, error);
}

async function requireAdminAal1() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.user) throw authError("SESSION_MISSING", "Sesi admin tidak tersedia.", sessionError);
  const admin = await resolveAdminUser(sessionData.session.user, { requireMfa: false });
  if (!admin) {
    await supabase.auth.signOut();
    throw new MfaFlowError("NOT_ADMIN", "Akun ini tidak memiliki akses Admin Dashboard.");
  }
  return { session: sessionData.session, admin };
}

export async function inspectAdminMfa() {
  const { session, admin } = await requireAdminAal1();
  const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  if (assuranceError) throw authError("ASSURANCE_FAILED", "Level keamanan sesi tidak dapat diperiksa.", assuranceError);
  if (factorsError) throw authError("FACTORS_FAILED", "Daftar factor MFA tidak dapat dimuat.", factorsError);
  const verifiedTotp = factors?.totp?.find((factor) => factor.status === "verified")
    || factors?.all?.find((factor) => factor.factor_type === "totp" && factor.status === "verified")
    || null;
  const unverifiedTotp = (factors?.all || []).filter((factor) => factor.factor_type === "totp" && factor.status !== "verified");
  return { session, admin, assurance, verifiedTotp, unverifiedTotp };
}

async function createEnrollment(userId, staleFactors) {
  for (const factor of staleFactors) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) throw authError("STALE_FACTOR_FAILED", "Setup MFA lama tidak dapat dibersihkan.", error);
  }
  const friendlyName = `Dimsum Lumer Admin ${userId.slice(0, 8)}`;
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
    issuer: "Dimsum Lumer Admin",
  });
  if (error) throw authError("ENROLL_FAILED", "Enrollment MFA gagal. Periksa konfigurasi TOTP pada Supabase Auth.", error);
  if (!data?.id) throw new MfaFlowError("ENROLL_INVALID", "Supabase tidak mengembalikan ID factor MFA.");
  if (!data.totp?.qr_code || !data.totp.qr_code.startsWith("data:image/svg+xml")) {
    throw new MfaFlowError("QR_MISSING", "QR code MFA tidak diterima dari Supabase. Batalkan setup dan coba kembali.");
  }
  return { factorId: data.id, qrCode: data.totp.qr_code };
}

export async function startTotpEnrollment() {
  const state = await inspectAdminMfa();
  if (state.assurance?.currentLevel === "aal2") return { alreadyVerified: true };
  if (state.verifiedTotp) throw new MfaFlowError("FACTOR_EXISTS", "Factor TOTP sudah aktif. Lanjutkan ke verifikasi MFA.");
  const userId = state.admin.id;
  if (!enrollmentRequests.has(userId)) {
    const request = createEnrollment(userId, state.unverifiedTotp)
      .finally(() => window.setTimeout(() => enrollmentRequests.delete(userId), 30_000));
    enrollmentRequests.set(userId, request);
  }
  return enrollmentRequests.get(userId);
}

export function normalizeTotpCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

export async function verifyTotpFactor(factorId, code) {
  await requireAdminAal1();
  const normalizedCode = normalizeTotpCode(code);
  if (!factorId) throw new MfaFlowError("FACTOR_MISSING", "Factor MFA tidak tersedia.");
  if (!/^\d{6}$/.test(normalizedCode)) throw new MfaFlowError("CODE_FORMAT", "Masukkan enam digit kode dari aplikasi Authenticator.");
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge?.id) throw authError("CHALLENGE_FAILED", "Challenge MFA gagal dibuat. Coba kembali.", challengeError);
  const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: normalizedCode });
  if (verifyError) throw authError("VERIFY_FAILED", "Verifikasi MFA gagal. Gunakan kode terbaru lalu coba kembali.", verifyError);
  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") {
    throw authError("AAL2_REQUIRED", "Verifikasi selesai tetapi sesi belum mencapai AAL2. Silakan masuk kembali.", assuranceError);
  }
  enrollmentRequests.clear();
  return assurance;
}

export async function signOutFromMfa() {
  enrollmentRequests.clear();
  await supabase.auth.signOut();
}

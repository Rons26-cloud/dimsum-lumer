import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");
const service = source("services/mfaService.js");
const setup = source("pages/MfaSetup.jsx");
const verify = source("pages/MfaVerify.jsx");
const router = source("router/AdminRouter.jsx");
const guard = source("router/ProtectedAdminRoute.jsx");
const auth = source("supabase/auth.js");
const masterSql = readFileSync(new URL("../../SUPABASE_MASTER_FIXED.sql", import.meta.url), "utf8");
const aal2Migration = readFileSync(new URL("../../supabase/migrations/20260814_enforce_admin_mfa_aal2.sql", import.meta.url), "utf8");

test("MFA memakai API TOTP Supabase lengkap", () => {
  for (const call of ["mfa.enroll", "mfa.listFactors", "mfa.challenge", "mfa.verify", "getAuthenticatorAssuranceLevel"]) {
    assert.match(service, new RegExp(call.replace(".", "\\.")));
  }
  assert.match(service, /currentLevel === "aal2"/);
});

test("setup dan verify adalah route terpisah", () => {
  assert.match(router, /path="\/mfa\/setup"/);
  assert.match(router, /path="\/mfa\/verify"/);
  assert.match(setup, /qrCode/);
  assert.doesNotMatch(verify, /<img|qrCode/);
});

test("dashboard membutuhkan sesi admin AAL2", () => {
  assert.match(auth, /mfaVerified \? admin : null/);
  assert.match(guard, /requiresMfa/);
  assert.match(guard, /to="\/mfa"/);
});

test("MFA tidak memakai penyimpanan browser atau kode hard-coded", () => {
  const mfaSources = `${service}\n${setup}\n${verify}`;
  assert.doesNotMatch(mfaSources, /localStorage|sessionStorage/);
  assert.doesNotMatch(mfaSources, /000000|123456/);
  assert.doesNotMatch(mfaSources, /service_role|database.{0,10}password/i);
});

test("SQL sesi perangkat hanya dapat diakses admin dengan AAL2", () => {
  const sessionBlock = masterSql.slice(
    masterSql.indexOf("create table if not exists public.admin_sessions"),
    masterSql.indexOf("create table if not exists public.activity_logs"),
  );
  assert.match(sessionBlock, /enable row level security/);
  assert.match(sessionBlock, /auth\.jwt\(\) ->> 'aal'.*= 'aal2'/);
  assert.match(sessionBlock, /admin_id = auth\.uid\(\)/);
  assert.match(masterSql, /select auth\.uid\(\) is not null\s+and coalesce\(auth\.jwt\(\) ->> 'aal', ''\) = 'aal2'/);
  assert.doesNotMatch(masterSql, /Compatibility gate: MFA disabled/);
});

test("metode pembayaran pengguna tidak dapat dihapus oleh aplikasi pelanggan", () => {
  const paymentService = readFileSync(new URL("../../frontend-web/src/services/paymentMethodService.js", import.meta.url), "utf8");
  const paymentBlock = masterSql.slice(
    masterSql.indexOf("-- USER PAYMENT METHODS"),
    masterSql.indexOf("commit;", masterSql.indexOf("-- USER PAYMENT METHODS")) + 7,
  );
  assert.match(paymentBlock, /payment methods owner read/);
  assert.match(paymentBlock, /payment methods owner insert/);
  assert.doesNotMatch(paymentBlock, /create policy "payment methods owner update"/);
  assert.doesNotMatch(paymentBlock, /payment methods owner delete/);
  assert.match(paymentBlock, /revoke update,delete on public\.user_payment_methods from authenticated/i);
  assert.match(paymentBlock, /admin_delete_user_payment_method/);
  assert.match(paymentBlock, /payment_method_admin_logs/);
  assert.doesNotMatch(paymentService, /\.(?:update|delete)\s*\(/);
});

test("database memisahkan pemeriksaan role admin dan gerbang AAL2", () => {
  const roleStart = aal2Migration.indexOf("create or replace function public.is_admin()")
  const aal2Start = aal2Migration.indexOf("create or replace function public.is_admin_aal2()")
  const roleBlock = aal2Migration.slice(roleStart, aal2Start)
  const aal2Block = aal2Migration.slice(aal2Start, aal2Migration.indexOf("create or replace function public.assert_admin_aal2()"))

  assert.match(roleBlock, /role in \('admin', 'superadmin'\)/)
  assert.doesNotMatch(roleBlock, /->> 'aal'/)
  assert.match(aal2Block, /public\.is_admin\(\)/)
  assert.match(aal2Block, /auth\.jwt\(\) ->> 'aal'.*'aal2'/s)
});

test("policy dan SECURITY DEFINER admin dimigrasikan ke AAL2 tanpa reset", () => {
  assert.match(aal2Migration, /from pg_policies/)
  assert.match(aal2Migration, /replace\(replace\(policy_record\.qual/)
  assert.match(aal2Migration, /'public\.is_admin\(\)', 'public\.is_admin_aal2\(\)'/)
  assert.match(aal2Migration, /'public\.is_superadmin\(\)', 'public\.is_superadmin_aal2\(\)'/)
  assert.match(aal2Migration, /and p\.prosecdef/)
  assert.match(aal2Migration, /pg_get_functiondef/)
  assert.doesNotMatch(aal2Migration, /truncate|disable row level security|drop table/i)
});

test("app_config hanya membuka key yang diklasifikasikan publik", () => {
  assert.match(aal2Migration, /add column if not exists is_public boolean not null default false/)
  assert.match(aal2Migration, /using \(is_public = true\)/)
  assert.match(aal2Migration, /key !~\* '\(secret\|password\|token/)
  assert.doesNotMatch(aal2Migration, /app_config[\s\S]{0,160}for select[\s\S]{0,80}using \(true\)/i)
});

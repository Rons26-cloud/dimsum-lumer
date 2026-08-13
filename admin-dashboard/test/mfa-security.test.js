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

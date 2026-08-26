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
const aal2Migration = readFileSync(new URL("../../supabase/migrations/20260814_enforce_admin_mfa_aal2.sql", import.meta.url), "utf8");
const isolationMigration = readFileSync(new URL("../../supabase/migrations/20260826141056_admin_account_mfa_isolation.sql", import.meta.url), "utf8");
const rpcHardeningMigration = readFileSync(new URL("../../supabase/migrations/20260826141741_revoke_public_privileged_functions.sql", import.meta.url), "utf8");
const searchPathMigration = readFileSync(new URL("../../supabase/migrations/20260826143922_harden_function_search_paths.sql", import.meta.url), "utf8");
const archiveMigration = readFileSync(new URL("../../supabase/migrations/20260826151345_protect_financial_archive_refresh.sql", import.meta.url), "utf8");
const adminManagement = source("components/account/AdminManagement.jsx");
const permissionRoute = source("router/PermissionRoute.jsx");
const appUpdateMigration = readFileSync(new URL("../../supabase/migrations/20260826195731_app_update_management.sql", import.meta.url), "utf8");
const appUpdatePage = source("pages/AppUpdates/index.jsx");
const appUpdateService = source("services/appUpdateService.js");
const merchantMigration = readFileSync(new URL("../../supabase/migrations/20260826203522_merchant_payment_accounts.sql", import.meta.url), "utf8");
const merchantPage = source("pages/MerchantAccounts/index.jsx");

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

test("setiap akun admin memiliki identitas email dan MFA sendiri", () => {
  assert.match(adminManagement, /isolatedAuth\.auth\.signUp/);
  assert.doesNotMatch(adminManagement, /data:\s*\{[^}]*role:\s*["']admin["']/s);
  assert.match(isolationMigration, /from auth\.users\s+where id = target_user_id/s);
  assert.match(isolationMigration, /raw_user_meta_data = \(coalesce\(raw_user_meta_data/);
  assert.match(isolationMigration, /- 'role'/);
  assert.match(isolationMigration, /perform public\.assert_superadmin_mfa\(\)/);
  assert.doesNotMatch(permissionRoute, /user_metadata\?\.role/);
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

test("fungsi privileged bukan RPC publik dan search_path dikunci", () => {
  assert.match(rpcHardeningMigration, /admin_get_customer_account\(uuid\) from public, anon/);
  assert.match(rpcHardeningMigration, /handle_new_user\(\) from public, anon, authenticated/);
  assert.match(searchPathMigration, /set search_path = pg_catalog, public, pg_temp/);
  assert.match(searchPathMigration, /add_order_point\(\) from public, anon, authenticated/);
  assert.match(archiveMigration, /refresh_monthly_financial_archive\(date\)/);
  assert.match(archiveMigration, /from public, anon, authenticated/);
});

test("app update mutation hanya tersedia untuk administrator AAL2", () => {
  assert.match(appUpdateMigration, /for insert\s+to authenticated\s+with check \(public\.is_admin_aal2\(\)\)/s);
  assert.match(appUpdateMigration, /for update\s+to authenticated\s+using \(public\.is_admin_aal2\(\)\)/s);
  assert.doesNotMatch(appUpdateMigration, /grant (insert|update|delete)[^;]* to anon/i);
  assert.match(appUpdateMigration, /revoke all on function public\.publish_android_app_update[\s\S]*from public, anon/);
});

test("public update check hanya mengembalikan read model minimum", () => {
  for (const field of ["updateEnabled", "latestVersion", "latestBuild", "minimumBuild", "forceUpdate", "downloadUrl", "releaseTitle", "releaseNotes"]) {
    assert.match(appUpdateMigration, new RegExp(`'${field}'`));
  }
  assert.doesNotMatch(appUpdateMigration.slice(appUpdateMigration.indexOf("create or replace function public.get_android_app_update")), /admin_id|old_data|new_data/);
});

test("halaman app update memakai konfirmasi dan URL HTTPS terkontrol", () => {
  assert.match(appUpdatePage, /Simpan perubahan update aplikasi/);
  assert.match(appUpdatePage, /Riwayat Update/);
  assert.match(appUpdateService, /url\.protocol !== "https:"/);
  assert.match(appUpdateService, /com\.dimsumlumer\.dimsum_lumer/);
  assert.doesNotMatch(appUpdateService, /service_role|key\.properties|keystore/i);
});

test("rekening toko hanya dapat dimutasi administrator AAL2", () => {
  assert.match(merchantMigration, /for insert to authenticated[\s\S]*public\.is_admin_aal2\(\)/);
  assert.match(merchantMigration, /for update to authenticated[\s\S]*public\.is_admin_aal2\(\)/);
  assert.match(merchantMigration, /revoke all on table public\.merchant_payment_accounts from public, anon/);
  assert.doesNotMatch(merchantMigration, /grant (insert|update|delete)[^;]* to anon/i);
});

test("read model rekening publik minimum dan halaman admin menyediakan CRUD", () => {
  assert.match(merchantMigration, /get_merchant_payment_accounts\(\)/);
  const publicColumns = merchantMigration.match(/get_merchant_payment_accounts\(\)[\s\S]*?returns table \(([\s\S]*?)\)/)?.[1] || "";
  assert.doesNotMatch(publicColumns, /created_at|updated_at/);
  for (const action of ["Tambah Rekening", "Ubah", "Hapus", "Aktif di pelanggan"]) assert.match(merchantPage, new RegExp(action));
});

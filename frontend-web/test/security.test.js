import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { safePaymentUrl } from "../src/utils/security.js";

test("payment redirects accept only approved HTTPS gateways", () => {
  assert.equal(
    safePaymentUrl("https://app.midtrans.com/snap/v4/redirection/token"),
    "https://app.midtrans.com/snap/v4/redirection/token",
  );
  assert.equal(safePaymentUrl("http://app.midtrans.com/payment"), "");
  assert.equal(safePaymentUrl("https://evil.example/phishing"), "");
  assert.equal(safePaymentUrl("javascript:alert(1)"), "");
  assert.equal(safePaymentUrl("https://user:pass@app.midtrans.com/payment"), "");
});

test("production checkout ignores client prices and removes legacy discount RPC", () => {
  const migrationUrl = new URL(
    "../../supabase/migrations/zzzz_20260810_production_security_final.sql",
    import.meta.url,
  );
  const sql = readFileSync(fileURLToPath(migrationUrl), "utf8");

  assert.match(sql, /drop function if exists public\.create_checkout_order/i);
  assert.match(sql, /from public\.cart_items where user_id = v_user_id/i);
  assert.match(sql, /v_unit_price := v_product\.price/i);
  assert.match(sql, /v_shipping := case p_shipping_method/i);
  assert.match(sql, /upper\(code\) = v_clean_code/i);
  assert.match(sql, /protect_order_financial_snapshot_trigger/i);
  assert.doesNotMatch(sql, /v_total\s*:=.*p_shipping_cost/i);
  assert.doesNotMatch(sql, /v_discount\s*:=.*p_discount/i);
});

test("edge functions use an explicit origin allowlist", () => {
  const corsUrl = new URL("../supabase/functions/_shared/cors.ts", import.meta.url);
  const sql = readFileSync(fileURLToPath(corsUrl), "utf8");
  assert.match(sql, /ALLOWED_ORIGINS/);
  assert.doesNotMatch(sql, /Access-Control-Allow-Origin['"]:\s*['"]\*['"]/);
});

test("production remediation blocks admin role escalation and requires AAL2", () => {
  const migrationUrl = new URL(
    "../../supabase/migrations/20260813_production_security_remediation.sql",
    import.meta.url,
  );
  const sql = readFileSync(fileURLToPath(migrationUrl), "utf8");
  assert.match(sql, /requester_can_manage boolean := public\.is_superadmin\(\) and public\.has_admin_mfa\(\)/i);
  assert.match(sql, /auth\.jwt\(\) ->> 'aal'.*= 'aal2'/i);
  assert.match(sql, /new\.role := old\.role/i);
  assert.match(sql, /drop policy if exists admin_manage on public\.profiles/i);
  assert.match(sql, /superadmin_manage_profiles/i);
});

test("client bundles reject service-role keys and edge errors stay generic", () => {
  const adminClient = readFileSync(fileURLToPath(new URL("../../admin-dashboard/src/supabase/client.js", import.meta.url)), "utf8");
  const paymentFunction = readFileSync(fileURLToPath(new URL("../supabase/functions/create-payment/index.ts", import.meta.url)), "utf8");
  assert.match(adminClient, /service_role/);
  assert.match(adminClient, /tidak boleh berisi service-role key/);
  assert.doesNotMatch(paymentFunction, /error instanceof Error \? error\.message/);
  assert.match(paymentFunction, /Pembayaran otomatis gagal diproses/);
});

test("payment proof memerlukan admin AAL2 sebelum service-role digunakan", () => {
  const source = readFileSync(fileURLToPath(new URL("../supabase/functions/get-payment-proof/index.ts", import.meta.url)), "utf8")
  const roleCheck = source.indexOf("['admin', 'superadmin'].includes")
  const assuranceCheck = source.indexOf("getAuthenticatorAssuranceLevel")
  const aal2Check = source.indexOf("currentLevel !== 'aal2'")
  const serviceClient = source.indexOf("createClient(url, serviceKey")

  assert.ok(roleCheck > 0)
  assert.ok(assuranceCheck > roleCheck)
  assert.ok(aal2Check > assuranceCheck)
  assert.ok(serviceClient > aal2Check)
  assert.match(source.slice(aal2Check, serviceClient), /403/)
  assert.doesNotMatch(source.slice(0, serviceClient), /createSignedUrl/)
});

test("live chat memisahkan blok setiap pelanggan melalui RLS", () => {
  const source = readFileSync(fileURLToPath(new URL("../../supabase/migrations/20260814_live_chat_private_user_blocks.sql", import.meta.url)), "utf8");
  assert.match(source, /revoke all on public\.live_chat_messages from public, anon/i);
  assert.match(source, /user_id\s*=\s*auth\.uid\(\)/i);
  assert.match(source, /conversation\.user_id\s*=\s*auth\.uid\(\)/i);
  assert.match(source, /public\.is_admin_aal2\(\)/i);
  assert.doesNotMatch(source, /using\s*\(\s*true\s*\)/i);
});

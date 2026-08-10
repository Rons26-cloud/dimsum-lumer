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

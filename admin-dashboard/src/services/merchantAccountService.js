import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";

const TYPES = new Set(["bank", "ewallet", "qris", "cod"]);

export function normalizeMerchantAccount(form) {
  const accountType = String(form.account_type || "");
  const methodCode = String(form.method_code || "").trim().toLowerCase();
  const providerName = String(form.provider_name || "").trim();
  const accountNumber = String(form.account_number || "").replace(/\D/g, "");
  const qrImageUrl = String(form.qr_image_url || "").trim();
  if (!TYPES.has(accountType)) throw new Error("Jenis rekening tidak valid.");
  if (!/^[a-z0-9][a-z0-9_-]{1,39}$/.test(methodCode)) throw new Error("Kode metode hanya boleh berisi huruf kecil, angka, garis bawah, atau tanda hubung.");
  if (providerName.length < 2 || providerName.length > 60) throw new Error("Nama bank atau provider harus berisi 2 sampai 60 karakter.");
  if (["bank", "ewallet"].includes(accountType) && (accountNumber.length < 6 || accountNumber.length > 34)) throw new Error("Nomor rekening harus berisi 6 sampai 34 angka.");
  if (accountType === "qris") {
    let url;
    try { url = new URL(qrImageUrl); } catch { throw new Error("URL gambar QRIS tidak valid."); }
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("Gambar QRIS wajib menggunakan URL HTTPS.");
  }
  return { method_code: methodCode, account_type: accountType, provider_name: providerName, account_name: String(form.account_name || "").trim() || null, account_number: accountNumber || null, qr_image_url: qrImageUrl || null, instructions: String(form.instructions || "").trim() || null, is_active: Boolean(form.is_active), is_primary: Boolean(form.is_primary), sort_order: Math.max(0, Number.parseInt(form.sort_order, 10) || 0) };
}

export async function listMerchantAccounts() {
  const { data, error } = await supabase.from(TABLES.MERCHANT_PAYMENT_ACCOUNTS).select("*").order("sort_order").order("created_at");
  if (error) throw error;
  return data || [];
}

export async function saveMerchantAccount(form) {
  const payload = normalizeMerchantAccount(form);
  const request = form.id ? supabase.from(TABLES.MERCHANT_PAYMENT_ACCOUNTS).update(payload).eq("id", form.id) : supabase.from(TABLES.MERCHANT_PAYMENT_ACCOUNTS).insert(payload);
  const { error } = await request;
  if (error) throw error;
}

export async function removeMerchantAccount(id) {
  const { error } = await supabase.from(TABLES.MERCHANT_PAYMENT_ACCOUNTS).delete().eq("id", id);
  if (error) throw error;
}

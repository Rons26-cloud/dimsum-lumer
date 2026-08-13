import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";

const ALLOWED_TYPES = new Set(["bank", "ewallet"]);
const clean = (value, max = 100) => String(value || "").trim().slice(0, max);

function payloadOf(userId, values) {
  const type = clean(values.type, 20).toLowerCase();
  const accountNumber = clean(values.account_number, 40).replace(/[^0-9]/g, "");
  if (!ALLOWED_TYPES.has(type)) throw new Error("Jenis metode pembayaran tidak valid.");
  if (accountNumber.length < 6 || accountNumber.length > 30) throw new Error("Nomor rekening atau e-wallet harus terdiri dari 6–30 digit.");
  if (clean(values.account_name, 100).length < 3) throw new Error("Nama pemilik rekening minimal 3 karakter.");
  if (clean(values.provider, 60).length < 2) throw new Error("Pilih atau isi nama bank/provider.");
  return {
    user_id: userId,
    type,
    provider: clean(values.provider, 60),
    account_name: clean(values.account_name, 100),
    account_number: accountNumber,
    label: clean(values.label, 50) || null,
    is_primary: Boolean(values.is_primary),
  };
}

export async function listPaymentMethods(userId) {
  const { data, error } = await supabase.from(TABLES.USER_PAYMENT_METHODS).select("*").eq("user_id", userId).order("is_primary", { ascending: false }).order("created_at", { ascending: false });
  if (error) {
    if (error.code === "23505") throw new Error("Metode utama sudah tersedia. Tambahkan rekening ini tanpa memilih opsi metode utama.");
    if (error.code === "23514") throw new Error("Data rekening tidak sesuai format. Pastikan nomor berisi 6–30 digit dan seluruh kolom wajib telah diisi.");
    if (error.code === "42501") throw new Error("Izin penambahan belum aktif di database. Jalankan pembaruan SUPABASE_MASTER_FIXED.sql terlebih dahulu.");
    throw new Error(error.message || "Metode pembayaran belum dapat ditambahkan. Silakan coba kembali.");
  }
  return data || [];
}

export async function addPaymentMethod(userId, values) {
  const payload = payloadOf(userId, values);
  const { data, error } = await supabase.from(TABLES.USER_PAYMENT_METHODS).insert(payload).select().single();
  if (error) throw error;
  return data;
}

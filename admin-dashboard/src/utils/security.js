const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanText(value, { field = "Input", maxLength = 255, required = false } = {}) {
  const text = String(value ?? "").replace(CONTROL_CHARACTERS, "").trim();
  if (required && !text) throw new Error(`${field} wajib diisi.`);
  if (text.length > maxLength) throw new Error(`${field} maksimal ${maxLength} karakter.`);
  return text;
}

export function safeNumber(value, { field = "Nilai", min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${field} harus berupa angka antara ${min} dan ${max}.`);
  }
  return number;
}

export function safeId(value) {
  const id = String(value ?? "").trim();
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error("ID data tidak valid.");
  return id;
}

export function safeHttpUrl(value, { field = "URL", allowEmpty = true } = {}) {
  const text = cleanText(value, { field, maxLength: 2048 });
  if (!text && allowEmpty) return null;
  let url;
  try { url = new URL(text); } catch { throw new Error(`${field} tidak valid.`); }
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error(`${field} hanya boleh menggunakan http atau https.`);
  return url.toString();
}

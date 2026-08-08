const SAFE_EXTERNAL_PROTOCOLS = new Set(["https:", "tel:"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PAYMENT_TYPES = new Set([...IMAGE_TYPES, "application/pdf"]);

export function safeExternalUrl(value, { allowTel = false } = {}) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value, window.location.origin);
    if (!SAFE_EXTERNAL_PROTOCOLS.has(url.protocol)) return "";
    if (url.protocol === "tel:" && !allowTel) return "";
    if (url.protocol === "tel:" && !/^\+?[0-9]{6,15}$/.test(url.pathname)) return "";
    return url.href;
  } catch {
    return "";
  }
}

export function safeErrorMessage(error, fallback) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (message.includes("rate limit") || message.includes("too many")) return "Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.";
  if (message.includes("network") || message.includes("fetch")) return "Koneksi ke server bermasalah. Silakan coba lagi.";
  return fallback;
}

function hasSignature(bytes, signature) {
  return signature.every((byte, index) => bytes[index] === byte);
}

export async function validateUpload(file, { payment = false, maxBytes = 5 * 1024 * 1024 } = {}) {
  if (!(file instanceof File)) throw new Error("File tidak valid.");
  const allowed = payment ? PAYMENT_TYPES : IMAGE_TYPES;
  if (!allowed.has(file.type)) throw new Error(payment ? "File harus JPG, PNG, WEBP, atau PDF." : "Gambar harus JPG, PNG, atau WEBP.");
  if (file.size < 1 || file.size > maxBytes) throw new Error(`Ukuran file maksimal ${Math.floor(maxBytes / 1024 / 1024)} MB.`);
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const valid =
    (file.type === "image/jpeg" && hasSignature(bytes, [0xff, 0xd8, 0xff])) ||
    (file.type === "image/png" && hasSignature(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    (file.type === "image/webp" && hasSignature(bytes, [0x52, 0x49, 0x46, 0x46]) && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") ||
    (file.type === "application/pdf" && hasSignature(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]));
  if (!valid) throw new Error("Isi file tidak sesuai dengan tipe file yang dipilih.");
  return file;
}

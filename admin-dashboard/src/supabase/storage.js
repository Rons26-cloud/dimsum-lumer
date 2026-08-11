import { supabase } from "./client.js";

const ALLOWED_BUCKETS = new Set(["product-images", "banners", "apk", "category-images", "reward-images"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_APK_SIZE = 250 * 1024 * 1024;

function assertBucket(bucket) {
  if (!ALLOWED_BUCKETS.has(bucket)) throw new Error("Bucket penyimpanan tidak diizinkan.");
}

function assertSafePath(path) {
  if (!/^[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|apk)$/i.test(path) || path.includes("..")) {
    throw new Error("Nama file tidak aman.");
  }
}

export function validateImageFile(file) {
  if (!(file instanceof File)) throw new Error("File gambar tidak valid.");
  if (!IMAGE_TYPES.has(file.type)) throw new Error("Gambar hanya boleh JPG, PNG, atau WebP.");
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) throw new Error("Ukuran gambar maksimal 5 MB.");
  return file;
}

export async function validateApkFile(file) {
  if (!(file instanceof File)) throw new Error("File APK tidak valid.");
  if (!/\.apk$/i.test(file.name)) throw new Error("File aplikasi wajib menggunakan ekstensi .apk.");
  if (file.size <= 0 || file.size > MAX_APK_SIZE) throw new Error("Ukuran APK maksimal 250 MB.");
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isZip = signature[0] === 0x50 && signature[1] === 0x4b && [0x03, 0x05, 0x07].includes(signature[2]);
  if (!isZip) throw new Error("Isi file bukan paket APK/ZIP yang valid.");
  return file;
}

export async function uploadFile(bucket, path, file) {
  assertBucket(bucket);
  assertSafePath(path);
  if (bucket === "apk") await validateApkFile(file);
  else validateImageFile(file);
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) {
    if (/bucket not found/i.test(error.message || "")) {
      throw new Error(`Bucket "${bucket}" belum dibuat di Supabase. Jalankan migration 20260808_storage_control_plane.sql.`);
    }
    if (/row-level security|policy/i.test(error.message || "")) {
      throw new Error(`Akun admin tidak memiliki izin upload ke bucket "${bucket}". Periksa role admin dan Storage policy Supabase.`);
    }
    throw error;
  }
  return data;
}
export function getPublicUrl(bucket, path) {
  assertBucket(bucket);
  assertSafePath(path);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
export async function getBucketUsage(bucket) {
  assertBucket(bucket);
  const { data, error } = await supabase.storage.from(bucket).list();
  if (error) throw error;
  return data;
}

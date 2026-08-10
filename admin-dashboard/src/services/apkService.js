import { getAll, insertRow } from "../supabase/database.js";
import { uploadFile, getPublicUrl } from "../supabase/storage.js";
import { BUCKETS } from "../supabase/constants.js";

export const getApkVersions = () => getAll("apk_versions", { order: { column: "created_at", ascending: false } });

export async function uploadApk(file, version) {
  const normalizedVersion = String(version || "").trim();
  if (!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(normalizedVersion)) throw new Error("Versi APK wajib memakai format semver, contoh 1.2.0.");
  const path = `apk/${normalizedVersion}/dimsum-lumer-${normalizedVersion}.apk`;
  await uploadFile(BUCKETS.APK, path, file);
  const url = getPublicUrl(BUCKETS.APK, path);
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  const sha256 = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const { data: authData } = await (await import("../supabase/client.js")).supabase.auth.getUser();
  return insertRow("apk_versions", { version: normalizedVersion, file_url: url, sha256, file_size: file.size, uploaded_by: authData?.user?.id || null });
}

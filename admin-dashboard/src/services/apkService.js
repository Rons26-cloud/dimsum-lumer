import { getAll, insertRow } from "../supabase/database.js";
import { uploadFile, getPublicUrl } from "../supabase/storage.js";
import { BUCKETS } from "../supabase/constants.js";

export const getApkVersions = () => getAll("apk_versions", { order: { column: "created_at", ascending: false } });

export async function uploadApk(file, version) {
  const path = `apk/${version}/${file.name}`;
  await uploadFile(BUCKETS.APK, path, file);
  const url = getPublicUrl(BUCKETS.APK, path);
  return insertRow("apk_versions", { version, file_url: url });
}

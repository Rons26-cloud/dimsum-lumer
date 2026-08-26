import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[+-][0-9A-Za-z.-]+)?$/;

const allowedDownloadHosts = () => {
  const hosts = new Set(["play.google.com"]);
  try { hosts.add(new URL(import.meta.env.VITE_SUPABASE_URL).host.toLowerCase()); } catch { /* optional */ }
  for (const host of (import.meta.env.VITE_APK_ALLOWED_HOSTS || "").split(",")) {
    if (host.trim()) hosts.add(host.trim().toLowerCase());
  }
  return hosts;
};

export function validateAppUpdateUrl(value) {
  let url;
  try { url = new URL(String(value || "").trim()); } catch { throw new Error("Download URL tidak valid."); }
  if (url.protocol !== "https:" || url.username || url.password || !allowedDownloadHosts().has(url.host.toLowerCase())) {
    throw new Error("Download URL harus menggunakan HTTPS dan domain distribusi resmi.");
  }
  if (url.host.toLowerCase() === "play.google.com") {
    if (url.pathname !== "/store/apps/details" || url.searchParams.get("id") !== "com.dimsumlumer.dimsum_lumer") {
      throw new Error("Tautan Google Play tidak mengarah ke package Dimsum Lumer.");
    }
  } else if (!url.pathname.toLowerCase().endsWith(".apk")) {
    throw new Error("Direct download harus mengarah ke file APK.");
  }
  return url.toString();
}

export function normalizeAppUpdateForm(form) {
  const versionName = String(form.version_name || "").trim();
  const buildNumber = Number(form.build_number);
  const minimumBuild = Number(form.minimum_build_number);
  const releaseTitle = String(form.release_title || "").trim();
  if (!VERSION_PATTERN.test(versionName)) throw new Error("Latest Version harus menggunakan format semver, contoh 1.2.4.");
  if (!Number.isInteger(buildNumber) || buildNumber <= 0) throw new Error("Latest Build Number harus berupa bilangan bulat positif.");
  if (!Number.isInteger(minimumBuild) || minimumBuild <= 0 || minimumBuild > buildNumber) throw new Error("Minimum build harus positif dan tidak boleh melebihi latest build.");
  if (releaseTitle.length < 3 || releaseTitle.length > 120) throw new Error("Release Title harus berisi 3 sampai 120 karakter.");
  const enabled = Boolean(form.update_enabled);
  const downloadUrl = form.download_url ? validateAppUpdateUrl(form.download_url) : "";
  if (enabled && !downloadUrl) throw new Error("Download URL wajib diisi saat update aktif.");
  return {
    p_version_name: versionName,
    p_build_number: buildNumber,
    p_minimum_build_number: minimumBuild,
    p_release_title: releaseTitle,
    p_release_notes: String(form.release_notes || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 50),
    p_download_url: downloadUrl || null,
    p_force_update: Boolean(form.force_update),
    p_update_enabled: enabled,
  };
}

export async function getAppUpdateHistory() {
  const { data, error } = await supabase.from(TABLES.APP_UPDATES).select("id,platform,version_name,build_number,minimum_build_number,release_title,release_notes,download_url,force_update,update_enabled,status,published_at,created_at,updated_at").order("build_number", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function publishAppUpdate(form) {
  const { data, error } = await supabase.rpc("publish_android_app_update", normalizeAppUpdateForm(form));
  if (error) throw error;
  return data;
}

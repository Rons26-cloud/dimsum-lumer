import { useEffect, useMemo } from "react";
import { supabase } from "../supabase/client.js";
import { useLiveCollection } from "./useLiveCollection.js";

const DEVICE_KEY = "dimsum-admin-device-id";
export function currentDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; localStorage.setItem(DEVICE_KEY, id); }
    return id;
  } catch { return `temporary-${Date.now()}`; }
}

function deviceInfo() {
  const ua = navigator.userAgent || "";
  const mobile = /Android|iPhone|iPod|Mobile/i.test(ua);
  const tablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const browser = /Edg\//i.test(ua) ? "Microsoft Edge" : /OPR\//i.test(ua) ? "Opera" : /Chrome\//i.test(ua) ? "Google Chrome" : /Firefox\//i.test(ua) ? "Mozilla Firefox" : /Safari\//i.test(ua) ? "Safari" : "Browser lainnya";
  const os = /Windows NT/i.test(ua) ? "Windows" : /Android/i.test(ua) ? "Android" : /iPhone|iPad|iPod/i.test(ua) ? "iOS/iPadOS" : /Mac OS X/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : navigator.platform || "Tidak diketahui";
  return {
    device_type: tablet ? "tablet" : mobile ? "mobile" : "desktop",
    device_name: `${os} · ${browser}`,
    browser, operating_system: os,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Tidak diketahui",
    locale: navigator.language || "id-ID",
    screen_size: `${window.screen?.width || 0}×${window.screen?.height || 0}`,
    user_agent: ua.slice(0, 500),
  };
}

export function useAdminDeviceSessions(adminId) {
  const rows = useLiveCollection("admin_sessions");
  const deviceId = useMemo(() => currentDeviceId(), []);
  useEffect(() => {
    if (!adminId) return undefined;
    let active = true;
    const heartbeat = async () => {
      if (!active) return;
      const payload = { admin_id: adminId, device_id: deviceId, ...deviceInfo(), last_seen_at: new Date().toISOString(), ended_at: null };
      const { error } = await supabase.from("admin_sessions").upsert(payload, { onConflict: "admin_id,device_id" });
      if (error && !/does not exist|schema cache|PGRST205/i.test(error.message || "")) console.warn("Sesi perangkat gagal dicatat:", error.message);
    };
    heartbeat();
    const timer = window.setInterval(heartbeat, 60_000);
    const visible = () => { if (document.visibilityState === "visible") heartbeat(); };
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [adminId, deviceId]);
  const sessions = useMemo(() => (rows || []).filter((row) => String(row.admin_id) === String(adminId)).sort((a, b) => new Date(b.last_seen_at || 0) - new Date(a.last_seen_at || 0)), [rows, adminId]);
  return { sessions, loading: rows === null, deviceId };
}

import React from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import logo from "../../assets/logo/logo.png";

const RECOVERY_KEY = "dimsum-lumer-refresh-recovery";
const recoveryStorage = {
  get() { try { return Number(sessionStorage.getItem(RECOVERY_KEY) || 0); } catch { return 0; } },
  set(value) { try { sessionStorage.setItem(RECOVERY_KEY, String(value)); } catch {  } },
  remove() { try { sessionStorage.removeItem(RECOVERY_KEY); } catch {  } },
};

async function clearStaleAppCache() {
  try {
    if ("caches" in window) await Promise.all((await caches.keys()).filter((name) => /workbox|dimsum|precache/i.test(name)).map((name) => caches.delete(name)));
    if ("serviceWorker" in navigator) await Promise.all((await navigator.serviceWorker.getRegistrations()).map((registration) => registration.update().catch(() => undefined)));
  } catch (error) { console.warn("Cache recovery dilewati:", error?.message || error); }
}

export default class AppErrorBoundary extends React.Component {
  state = { error: null, recovering: false };
  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) {
    console.error("[AppErrorBoundary]", error, info);
    const lastRecovery = recoveryStorage.get();
    const mayRecover = Date.now() - lastRecovery > 30_000;
    if (mayRecover) {
      recoveryStorage.set(Date.now());
      this.setState({ recovering: true });
      clearStaleAppCache().finally(() => window.setTimeout(() => window.location.reload(), 150));
    }
  }

  componentDidMount() {
    this.stableTimer = window.setTimeout(() => recoveryStorage.remove(), 15_000);
  }
  componentWillUnmount() { window.clearTimeout(this.stableTimer); }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.state.recovering) return <main className="grid min-h-dvh place-items-center bg-orange-50 p-5"><section className="text-center"><img src={logo} alt="Dimsum Lumer" className="mx-auto h-24 w-24 animate-pulse rounded-full object-cover shadow-lg"/><RefreshCw className="mx-auto mt-5 animate-spin text-orange-500" size={22}/><p className="mt-3 text-sm font-bold text-gray-700">Memulihkan aplikasi...</p><p className="mt-1 text-xs text-gray-400">Mohon tunggu sebentar, halaman akan kembali otomatis.</p></section></main>;
    return <main className="relative grid min-h-dvh overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 text-slate-900"><section className="relative m-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-6 text-center shadow-2xl sm:p-8"><img src={logo} alt="Dimsum Lumer" className="mx-auto h-28 w-28 rounded-full object-cover shadow-lg"/><div className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[9px] font-bold uppercase tracking-[.16em] text-orange-700"><AlertTriangle size={12}/>Gangguan sementara</div><h1 className="mt-4 text-xl font-extrabold">Aplikasi belum dapat dimuat</h1><p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-slate-500">Pemulihan otomatis sudah dicoba. Koneksi atau penyimpanan browser mungkin sedang bermasalah.</p><div className="mt-6 grid grid-cols-2 gap-2.5"><button onClick={() => window.location.assign("/")} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold"><Home size={15}/>Beranda</button><button onClick={async () => { sessionStorage.removeItem(RECOVERY_KEY); await clearStaleAppCache(); window.location.reload(); }} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-orange-500 text-[11px] font-bold text-white"><RefreshCw size={15}/>Perbaiki Lagi</button></div></section></main>;
  }
}

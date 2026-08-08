import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("[AdminDashboard] Unhandled UI error", error, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return <main className="grid min-h-dvh place-items-center bg-gray-50 p-4"><section role="alert" className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-7 text-center shadow-sm"><AlertTriangle className="mx-auto text-red-500" size={38}/><h1 className="mt-4 text-lg font-bold text-gray-900">Dashboard mengalami kendala</h1><p className="mt-2 text-sm text-gray-500">Muat ulang halaman. Jika masalah berulang, periksa koneksi dan konfigurasi Supabase.</p><button type="button" onClick={()=>window.location.reload()} className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white"><RefreshCw size={16}/>Muat Ulang</button></section></main>;
  }
}

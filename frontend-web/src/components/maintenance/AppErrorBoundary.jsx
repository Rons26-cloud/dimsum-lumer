import React from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default class AppErrorBoundary extends React.Component {
  state={error:null};
  static getDerivedStateFromError(error){return{error};}
  componentDidCatch(error,info){console.error('[AppErrorBoundary]',error,info);}
  render(){if(!this.state.error)return this.props.children;return <main className="grid min-h-dvh place-items-center bg-white p-5"><section className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-card"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500"><AlertTriangle/></span><h1 className="mt-4 text-sm font-extrabold">Aplikasi mengalami kendala</h1><p className="mt-2 text-[10px] leading-5 text-gray-500">Data akun tetap aman. Muat ulang aplikasi atau kembali ke Beranda.</p><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={()=>window.location.assign('/')} className="flex h-10 items-center justify-center gap-1 rounded-xl border border-gray-200 text-[10px] font-bold"><Home size={14}/>Beranda</button><button onClick={()=>window.location.reload()} className="flex h-10 items-center justify-center gap-1 rounded-xl bg-primary text-[10px] font-bold text-white"><RefreshCw size={14}/>Muat Ulang</button></div></section></main>;}
}

import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MessageCircle, ShieldCheck, Wrench } from 'lucide-react';
import logo from '../../assets/logo/logo.png';

const FALLBACK = 'Mohon maaf, Dimsum Lumer sedang dalam pemeliharaan untuk meningkatkan kualitas layanan. Silakan kembali beberapa saat lagi.';

function Countdown({ endTime }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  if (!endTime) return <span>Menunggu konfirmasi admin</span>;
  const remaining = Math.max(0, new Date(endTime).getTime() - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor(remaining / 3_600_000) % 24;
  const minutes = Math.floor(remaining / 60_000) % 60;
  const seconds = Math.floor(remaining / 1000) % 60;
  return <span>{days ? `${days} hari ` : ''}{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>;
}

export function MaintenancePage({ message, startTime, endTime }) {
  const dateTime = (value) => value ? new Date(value).toLocaleString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Belum ditentukan';
  return <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-b from-orange-50 via-white to-amber-50 p-4 font-sans">
    <div className="absolute -left-24 -top-24 -z-10 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl"/>
    <div className="absolute -bottom-32 -right-20 -z-10 h-96 w-96 rounded-full bg-amber-200/50 blur-3xl"/>
    <section className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-orange-100 bg-white/90 px-5 py-8 text-center shadow-2xl shadow-orange-200/50 backdrop-blur sm:px-10 sm:py-10">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"/>
      <div className="relative mx-auto h-32 w-32">
        <span className="absolute inset-0 animate-ping rounded-full border border-orange-300/40"/>
        <span className="absolute inset-3 animate-pulse rounded-full bg-orange-200/35 blur-xl"/>
        <div className="absolute inset-1 animate-[bounce_2.4s_ease-in-out_infinite] drop-shadow-[0_14px_18px_rgba(234,88,12,0.22)]">
          <img src={logo} alt="Logo Dimsum Lumer" className="h-full w-full object-contain"/>
        </div>
        <span className="absolute bottom-1 right-0 grid h-10 w-10 animate-[pulse_1.8s_ease-in-out_infinite] place-items-center rounded-full border-4 border-white bg-orange-500 text-white shadow-lg"><Wrench size={17}/></span>
      </div>
      <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-orange-700"><span className="h-2 w-2 animate-pulse rounded-full bg-orange-500"/>Pembaruan sistem berlangsung</span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Sedang Dalam Perbaikan</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500 sm:text-base sm:leading-7">{message?.trim() || FALLBACK}</p>
      <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
        <div className="grid grid-cols-1 gap-2 text-left sm:grid-cols-2"><div className="rounded-xl bg-white p-3"><span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-gray-400"><CalendarDays size={12}/>Mulai</span><strong className="mt-1 block text-xs text-gray-700">{dateTime(startTime)}</strong></div><div className="rounded-xl bg-white p-3"><span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-gray-400"><CalendarDays size={12}/>Selesai</span><strong className="mt-1 block text-xs text-gray-700">{dateTime(endTime)}</strong></div></div>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-orange-700"><Clock3 size={15}/>Sisa waktu: <Countdown endTime={endTime}/></div>
        <div className="mt-4 flex gap-2">{[0,1,2,3,4].map((item) => <span key={item} className="h-2 flex-1 overflow-hidden rounded-full bg-orange-100"><span className="block h-full w-full animate-pulse rounded-full bg-gradient-to-r from-orange-400 to-amber-400" style={{ animationDelay: `${item * 180}ms` }}/></span>)}</div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 border-t border-gray-100 pt-5 text-xs text-gray-400"><ShieldCheck size={15} className="text-emerald-500"/>Data dan akun Anda tetap aman</div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-400"><MessageCircle size={14} className="text-orange-500"/>Butuh bantuan mendesak? Hubungi admin Dimsum Lumer.</div>
    </section>
  </main>;
}

import { ArrowRight, Heart, LogIn, PackageCheck, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import logo from "../../assets/logo/logo.png";

const benefits=[
  {Icon:PackageCheck,label:"Pantau pesanan"},
  {Icon:Heart,label:"Simpan favorit"},
  {Icon:Sparkles,label:"Promo & poin"},
];

export default function GuestCard({onLogin,onRegister=()=>window.location.assign('/register'),onBrowse=()=>window.location.assign('/produk')}) {
  return <div className="space-y-3 rounded-[2rem] bg-gradient-to-b from-stone-100 via-white to-orange-50/50 p-2.5 sm:p-4">
    <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-orange-900 via-orange-700 to-amber-600 px-4 py-7 text-center text-white shadow-xl shadow-orange-950/20 sm:px-7 sm:py-9">
      <div className="absolute -right-16 -top-20 -z-10 h-52 w-52 rounded-full bg-white/15"/><div className="absolute -bottom-24 -left-16 -z-10 h-52 w-52 rounded-full bg-yellow-200/20 blur-xl"/>
      <div className="mx-auto grid h-32 w-32 place-items-center sm:h-36 sm:w-36"><img src={logo} alt="Logo transparan Dimsum Lumer" className="h-full w-full object-contain drop-shadow-[0_14px_18px_rgba(60,25,5,.35)]"/></div>
      <div className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur"><ShieldCheck size={12}/>Akun aman & terpercaya</div>
      <h2 className="mt-3 text-xl font-black leading-tight sm:text-2xl">Selamat datang!</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-[11px] leading-5 text-white/85 sm:text-xs">Masuk untuk pengalaman belanja Dimsum Lumer yang lebih cepat dan personal.</p>
      <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2">{benefits.map(({Icon,label})=><div key={label} className="rounded-2xl border border-white/15 bg-white/10 px-1.5 py-3 text-center backdrop-blur"><Icon size={17} className="mx-auto"/><span className="mt-1.5 block text-[8px] font-semibold leading-3 sm:text-[9px]">{label}</span></div>)}</div>
      <div className="mx-auto mt-5 grid max-w-md gap-2.5 xs:grid-cols-2"><button type="button" onClick={onLogin} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-xs font-extrabold text-primary shadow-lg transition active:scale-[.98]"><LogIn size={17}/>Masuk</button><button type="button" onClick={onRegister} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/50 bg-white/15 px-4 text-xs font-extrabold text-white backdrop-blur transition active:scale-[.98]"><UserPlus size={17}/>Buat Akun</button></div>
    </section>
    <section className="rounded-2xl border border-orange-100 bg-white/90 p-4 text-center shadow-sm sm:p-5"><span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-primary"><Sparkles size={19}/></span><h3 className="mt-2.5 text-sm font-extrabold text-gray-950">Lihat menu terlebih dahulu</h3><p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-gray-500 sm:text-xs">Kamu tetap dapat melihat seluruh produk dan harga sebelum masuk.</p><button type="button" onClick={onBrowse} className="mx-auto mt-3 flex min-h-11 w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 text-[10px] font-bold text-white transition active:scale-[.98]">Lihat Semua Menu<ArrowRight size={14}/></button></section>
    <p className="px-3 pb-1 text-center text-[9px] leading-4 text-gray-400">Dengan masuk atau membuat akun, kamu menyetujui ketentuan layanan dan kebijakan privasi Dimsum Lumer.</p>
  </div>;
}

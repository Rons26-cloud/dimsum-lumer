import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/client.js";

const COOLDOWN_KEY="dimsum-password-reset-cooldown";
const remainingSeconds=()=>{try{return Math.max(0,Math.ceil((Number(localStorage.getItem(COOLDOWN_KEY)||0)-Date.now())/1000));}catch{return 0;}};

export default function ForgotPassword(){
  const [email,setEmail]=useState("");
  const [loading,setLoading]=useState(false);
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");
  const [countdown,setCountdown]=useState(remainingSeconds);

  useEffect(()=>{if(countdown<=0)return;const timer=window.setInterval(()=>setCountdown(remainingSeconds()),1000);return()=>window.clearInterval(timer);},[countdown]);

  const submit=async(event)=>{
    event?.preventDefault();
    if(countdown>0){setError(`Tunggu ${countdown} detik sebelum meminta email baru.`);return;}
    setLoading(true);setError("");
    const normalized=email.trim().toLowerCase();
    try{
      const redirectTo=new URL('/reset-password',window.location.origin).toString();
      const {error:requestError}=await supabase.auth.resetPasswordForEmail(normalized,{redirectTo});
      if(requestError)throw requestError;
      const expiresAt=Date.now()+60_000;
      try{localStorage.setItem(COOLDOWN_KEY,String(expiresAt));}catch{/* storage privat */}
      setCountdown(60);setSent(true);
    }catch(reason){
      const rateLimited=reason?.status===429||/rate.?limit|too many/i.test(reason?.message||'');
      setError(rateLimited?'Permintaan terlalu sering. Demi keamanan akun, silakan tunggu beberapa saat sebelum mencoba kembali.':reason.message||'Email pemulihan gagal dikirim.');
    }finally{setLoading(false);}
  };

  return <div className="mx-auto w-full max-w-sm text-center">
    <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-primary"><Mail size={28}/></span>
    <h1 className="mt-4 text-xl font-extrabold text-gray-950">Lupa Kata Sandi</h1>
    <p className="mt-1 text-xs leading-5 text-gray-500">Masukkan email akun. Kami akan mengirim tautan untuk membuat kata sandi baru.</p>
    {sent?<div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left"><CheckCircle2 size={20} className="text-emerald-600"/><strong className="mt-2 block text-sm text-emerald-800">Periksa email kamu</strong><p className="mt-1 text-xs leading-5 text-emerald-700">Tautan pemulihan telah dikirim ke {email.trim().toLowerCase()}. Periksa juga folder Spam.</p><button type="button" disabled={countdown>0||loading} onClick={()=>{setSent(false);setError('');}} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-800 disabled:opacity-50"><RotateCw size={13}/>{countdown>0?`Kirim ulang dalam ${countdown} detik`:'Kirim ulang'}</button></div>:<form onSubmit={submit} className="mt-6 space-y-3 text-left"><label className="flex min-h-12 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 focus-within:border-primary"><Mail size={17} className="text-gray-400"/><input required type="email" autoComplete="email" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="nama@email.com" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>{error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-xs leading-5 text-red-600">{error}</p>}<button disabled={loading||countdown>0} className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white disabled:opacity-60">{loading?<Loader2 size={17} className="animate-spin"/>:countdown>0?`Tunggu ${countdown} detik`:'Kirim Tautan Pemulihan'}</button></form>}
    <Link to="/login" className="mt-5 inline-block text-xs font-bold text-primary">Kembali ke halaman masuk</Link>
  </div>;
}

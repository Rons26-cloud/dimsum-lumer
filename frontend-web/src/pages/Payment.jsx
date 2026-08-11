import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, CheckCircle2, Clock3, CreditCard,
  FileImage, Info, Loader2, LockKeyhole, MessageCircle, ReceiptText,
  ShieldCheck, Smartphone, UploadCloud, Zap,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase/client.js';
import { useAuth } from '../hooks/useAuth.js';
import qrisPlaceholder from '../assets/payment/qris-placeholder.jpg';
import { safePaymentUrl, validateUpload } from '../utils/security.js';
import { runtimeId } from '../utils/runtimeId.js';
import PaymentHeaderCard from '../components/payment/PaymentHeaderCard.jsx';
import qrisLogo from '../assets/payment/qris-logo.svg';
import bankTransferLogo from '../assets/payment/bank-transfer-logo.svg';

const money = (value) => `Rp${Number(value || 0).toLocaleString('id-ID')}`;
const paymentLabel = { qris: 'QRIS', transfer: 'Transfer Bank', gopay: 'GoPay', ovo: 'OVO', shopeepay: 'ShopeePay', dana: 'DANA' };

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const automaticPaymentEnabled = import.meta.env.VITE_ENABLE_AUTO_PAYMENT === 'true';
  const [paymentMode, setPaymentMode] = useState(() => import.meta.env.VITE_ENABLE_AUTO_PAYMENT === 'true' ? 'automatic' : 'manual');
  const [autoLoading, setAutoLoading] = useState(false);
  const expirationHandled = useRef(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const storedId = sessionStorage.getItem('dimsum-lumer-last-order-id');
      const candidates = [orderId, storedId].filter((value, index, list) => value && value !== 'undefined' && value !== 'null' && list.indexOf(value) === index);
      let found = null;
      for (const id of candidates) {
        const { data, error: loadError } = await supabase.from('orders').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
        if (loadError) throw loadError;
        if (data) { found = data; break; }
      }
      if (!found) {
        const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data, error: latestError } = await supabase.from('orders').select('*').eq('user_id', user.id).gte('created_at', since).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (latestError) throw latestError;
        found = data;
      }
      setOrder(found);
      if (found?.id) {
        sessionStorage.setItem('dimsum-lumer-last-order-id', found.id);
        if (found.id !== orderId) navigate(`/pembayaran/${found.id}`, { replace: true });
      }
    } catch (reason) {
      setError(reason.message || 'Pesanan gagal dimuat.');
      setOrder(null);
    } finally { setLoading(false); }
  }, [navigate, orderId, user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!order?.id || expirationHandled.current) return;
    const deadline = new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000;
    if (Date.now() < deadline || ['paid', 'verified'].includes(order.payment_status) || order.status !== 'pending') return;
    expirationHandled.current = true;
    supabase.rpc('expire_unpaid_order', { p_order_id: order.id }).then(({ error: expireError }) => {
      if (expireError) { expirationHandled.current = false; setError('Waktu pembayaran habis. Hubungi admin jika pesanan belum dibatalkan otomatis.'); return; }
      setOrder((current) => current ? { ...current, status: 'cancelled', payment_status: 'failed' } : current);
    });
  }, [now, order]);
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = async (event) => {
    const selected = event.target.files?.[0];
    setError(''); setFile(null);
    if (!selected) return;
    try { await validateUpload(selected, { payment: true }); setFile(selected); }
    catch (reason) { event.target.value = ''; setError(reason.message); }
  };
  const submit = async () => {
    if (!file || !order || !user) return;
    setSaving(true); setError('');
    try {
      await validateUpload(file, { payment: true });
      const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[file.type];
      const path = `${user.id}/${order.id}/${runtimeId()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { error: updateError } = await supabase.rpc('submit_payment_proof', { p_order_id: order.id, p_proof_path: path });
      if (updateError) { await supabase.storage.from('payment-proofs').remove([path]); throw updateError; }
      const { data: signed } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 3600);
      navigate('/checkout/sukses', { replace: true, state: { orderId: order.id, orderCode: order.order_code, total: order.total_amount || order.total, proofUrl: signed?.signedUrl || '', paymentStatus: 'waiting_verification' } });
    } catch (reason) {
      const message = String(reason?.message || '');
      setError(/bucket not found/i.test(message)
        ? 'Penyimpanan bukti pembayaran belum diaktifkan oleh admin. Jalankan SQL instalasi payment-proofs di Supabase.'
        : message || 'Bukti pembayaran gagal dikirim. Periksa file dan coba lagi.');
    }
    finally { setSaving(false); }
  };
  const help = () => {
    const number = String(import.meta.env.VITE_ADMIN_WA_NUMBER || '').replace(/\D/g, '');
    if (number) window.open(`https://wa.me/${number}?text=${encodeURIComponent(`Halo Admin Dimsum Lumer, saya membutuhkan bantuan untuk pembayaran pesanan ${order?.order_code || order?.id}.`)}`, '_blank', 'noopener,noreferrer');
  };
  const startAutomaticPayment = async () => {
    if (!order || !user) return;
    setAutoLoading(true); setError('');
    try {
      const existingUrl = order.payment_url || order.invoice_url || order.redirect_url;
      if (existingUrl) {
        const trustedUrl = safePaymentUrl(existingUrl);
        if (!trustedUrl) throw new Error('Tautan pembayaran ditolak karena domain tidak terpercaya.');
        window.location.assign(trustedUrl); return;
      }
      const { data, error: paymentError } = await supabase.functions.invoke('create-payment', { body: { order_id: order.id } });
      if (paymentError) throw paymentError;
      const paymentUrl = data?.redirect_url || data?.payment_url || data?.invoice_url;
      if (!paymentUrl) throw new Error('Gateway belum mengembalikan tautan pembayaran. Pilih pembayaran manual atau hubungi admin.');
      const trustedUrl = safePaymentUrl(paymentUrl);
      if (!trustedUrl) throw new Error('Gateway mengembalikan domain pembayaran yang tidak terpercaya.');
      window.location.assign(trustedUrl);
    } catch (reason) {
      const rawMessage = String(reason?.message || '');
      const unreachable = /failed to send|failed to fetch|edge function/i.test(rawMessage);
      setError(unreachable
        ? 'Layanan pembayaran otomatis belum aktif. Silakan gunakan pembayaran manual sementara waktu.'
        : rawMessage || 'Pembayaran otomatis belum tersedia. Silakan pilih pembayaran manual.');
    } finally { setAutoLoading(false); }
  };

  if (loading) return <div className="grid min-h-dvh place-items-center bg-slate-50"><div className="text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm"><Loader2 className="animate-spin text-primary" /></span><p className="mt-4 text-xs font-semibold text-slate-600">Menyiapkan pembayaran...</p><p className="mt-1 text-[10px] text-slate-400">Mohon tunggu sebentar</p></div></div>;
  if (!order) return <div className="grid min-h-dvh place-items-center bg-white px-6 text-center"><div><ReceiptText size={38} className="mx-auto text-slate-300" /><p className="mt-3 text-xs font-semibold text-slate-600">Pesanan tidak ditemukan atau bukan milik akun ini.</p>{error && <p className="mt-2 text-[10px] text-red-500">{error}</p>}<button type="button" onClick={() => navigate('/orders', { replace: true })} className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-[10px] font-bold text-white">Lihat Riwayat Pesanan</button></div></div>;

  const total = Number(order.total_amount || order.total || 0);
  const shipping = Number(order.shipping_cost || order.shipping_fee || 0);
  const discount = Number(order.discount_amount || 0);
  const subtotal = Number(order.subtotal || Math.max(0, total - shipping + discount));
  const account = import.meta.env.VITE_SELLER_ACCOUNT || '1234567890';
  const method = order.payment_method || 'transfer';
  const bank = import.meta.env.VITE_SELLER_BANK || 'BCA';
  const seller = import.meta.env.VITE_SELLER_NAME || 'DIMSUM LUMER';
  const expiresAt = new Date(new Date(order.created_at || Date.now()).getTime() + 24 * 60 * 60 * 1000);
  const remaining = Math.max(0, expiresAt.getTime() - now);
  const remainingHours = Math.floor(remaining / 3600000);
  const remainingMinutes = Math.floor((remaining % 3600000) / 60000);
  const remainingSeconds = Math.floor((remaining % 60000) / 1000);
  const instructions = [
    method === 'qris' ? 'Buka aplikasi bank atau dompet digital, lalu pilih menu Scan QRIS.' : `Buka aplikasi ${bank} atau bank lain, lalu pilih menu transfer.`,
    method === 'qris' ? 'Pindai QR di bawah dan masukkan nominal pembayaran.' : `Masukkan nomor rekening tujuan dan nominal ${money(total)}.`,
    `Pastikan penerima atas nama ${seller}, lalu selesaikan pembayaran.`,
    'Simpan bukti transaksi dan unggah pada bagian konfirmasi.',
  ];

  return <div className="min-h-dvh bg-[#f4f6f8] pb-28 text-slate-900">
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-xl items-center px-3"><button type="button" onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100 active:scale-95" aria-label="Kembali"><ArrowLeft size={20} /></button><div className="min-w-0 flex-1 text-center"><h1 className="text-[15px] font-bold tracking-tight">Pembayaran</h1><p className="truncate text-[10px] font-medium text-slate-400">Transaksi aman Dimsum Lumer</p></div><button type="button" onClick={help} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-emerald-600 shadow-sm" aria-label="Bantuan WhatsApp"><MessageCircle size={18} /></button></div></header>
    <main className="mx-auto max-w-xl space-y-4 px-3 py-4 sm:px-5">
      <PaymentHeaderCard selectedMethod={method === 'transfer' ? bank : method} orderCode={order.order_code ? `#${order.order_code}` : order.id} accountNumber={method === 'qris' ? '' : account} recipientName={seller} />
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Total Pembayaran</p><strong className="mt-1 block text-xl font-black text-slate-900">{money(total)}</strong></div><button type="button" onClick={() => navigator.clipboard.writeText(String(total))} className="flex min-h-10 items-center gap-2 rounded-xl bg-orange-50 px-3.5 text-[10px] font-extrabold text-primary"><CreditCard size={14} />Salin nominal</button></div></section>
      <section className={`rounded-2xl border p-3.5 ${remaining > 0 ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}><div className="flex items-center gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${remaining > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}><Clock3 size={17} /></span><div className="min-w-0 flex-1"><p className={`text-[10px] font-semibold ${remaining > 0 ? 'text-amber-800' : 'text-red-700'}`}>{remaining > 0 ? 'Selesaikan pembayaran sebelum' : 'Waktu pembayaran telah habis'}</p><p className={`mt-0.5 text-xs font-extrabold ${remaining > 0 ? 'text-amber-950' : 'text-red-900'}`}>{expiresAt.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p></div><span className="min-w-[82px] rounded-lg bg-white px-2.5 py-1.5 text-center text-[10px] font-black tabular-nums text-amber-700 shadow-sm">{remaining > 0 ? `${String(remainingHours).padStart(2,'0')}:${String(remainingMinutes).padStart(2,'0')}:${String(remainingSeconds).padStart(2,'0')}` : 'Dibatalkan'}</span></div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-primary"><CreditCard size={17} /></span><div><p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Metode pembayaran</p><h2 className="mt-0.5 text-sm font-extrabold">{paymentLabel[method] || 'Transfer Bank'}</h2></div></div><span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Menunggu</span></div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3"><h2 className="text-sm font-extrabold">Pilih cara pembayaran</h2><p className="mt-0.5 text-[9px] text-slate-400">Pilih verifikasi otomatis atau transfer manual</p></div><div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5"><button type="button" disabled={!automaticPaymentEnabled} onClick={() => { setPaymentMode('automatic'); setError(''); }} className={`relative rounded-xl px-3 py-3 text-left transition ${paymentMode === 'automatic' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'} disabled:cursor-not-allowed disabled:opacity-55`}><span className="flex h-10 items-center rounded-lg bg-white p-1"><img src={qrisLogo} alt="Logo QRIS" className="h-full w-auto max-w-full object-contain" /></span><strong className="mt-2 block text-[11px]">QRIS Otomatis</strong><small className="mt-0.5 block text-[8px] leading-3">{automaticPaymentEnabled ? 'Terverifikasi langsung oleh sistem' : 'Aktif setelah gateway terpasang'}</small>{!automaticPaymentEnabled && <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2 py-1 text-[7px] font-bold text-amber-700">BELUM AKTIF</span>}</button><button type="button" onClick={() => { setPaymentMode('manual'); setError(''); }} className={`rounded-xl px-3 py-3 text-left transition ${paymentMode === 'manual' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}><span className="flex h-10 items-center rounded-lg bg-white p-1"><img src={bankTransferLogo} alt="Logo transfer bank" className="h-full w-auto max-w-full object-contain" /></span><strong className="mt-2 block text-[11px]">Transfer Manual</strong><small className="mt-0.5 block text-[8px] leading-3">Bayar lalu unggah bukti</small></button></div></section>

      {paymentMode === 'automatic' ? <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><span className="flex h-14 w-28 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><img src={qrisLogo} alt="QRIS otomatis" className="h-full w-full object-contain" /></span><div><h2 className="text-sm font-extrabold text-slate-900">Bayar dengan QRIS Otomatis</h2><p className="mt-1 text-[9px] leading-4 text-slate-500">Pindai QR dari gateway resmi. Pembayaran akan langsung dikenali tanpa mengunggah bukti.</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-emerald-50 p-3"><CheckCircle2 size={15} className="text-emerald-600" /><strong className="mt-2 block text-[9px] text-emerald-900">Verifikasi instan</strong></div><div className="rounded-xl bg-blue-50 p-3"><ShieldCheck size={15} className="text-blue-600" /><strong className="mt-2 block text-[9px] text-blue-900">Gateway aman</strong></div></div>{error && <p role="alert" className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-[10px] leading-4 text-red-600">{error}</p>}</section> : <>
      {method === 'qris' && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white"><Smartphone size={21} /></span><h2 className="mt-3 text-base font-extrabold">Pindai kode QRIS</h2><p className="mx-auto mt-1 max-w-xs text-[10px] leading-4 text-slate-500">Gunakan aplikasi mobile banking atau dompet digital yang mendukung QRIS.</p></div><div className="mx-auto mt-5 max-w-[260px] rounded-[26px] border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/60"><img src={import.meta.env.VITE_SELLER_QRIS_IMAGE || qrisPlaceholder} alt="QRIS resmi Dimsum Lumer" className="aspect-square w-full rounded-2xl object-contain" /><div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2 text-[9px] font-bold text-slate-500"><ShieldCheck size={12} className="text-emerald-600" />QRIS resmi {seller}</div></div></section>}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Info size={17} /></span><div><h2 className="text-sm font-extrabold">Cara pembayaran</h2><p className="text-[9px] text-slate-400">Ikuti langkah berikut agar transaksi berhasil</p></div></div><ol className="mt-4 space-y-3">{instructions.map((text, index) => <li key={text} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-900 text-[9px] font-extrabold text-white">{index + 1}</span><p className="pt-1 text-[10px] leading-4 text-slate-600">{text}</p></li>)}</ol></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-primary"><UploadCloud size={20} /></span><div><h2 className="text-sm font-extrabold">Konfirmasi pembayaran</h2><p className="mt-0.5 text-[10px] leading-4 text-slate-500">Unggah bukti transfer yang menampilkan nominal, waktu, dan penerima dengan jelas.</p></div></div><label className="mt-4 flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-primary/50 hover:bg-orange-50/40 active:scale-[.99]"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={selectFile} className="sr-only" />{preview ? <img src={preview} alt="Pratinjau bukti pembayaran" className="max-h-56 rounded-xl object-contain shadow-sm" /> : <><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-primary shadow-sm"><FileImage size={22} /></span><strong className="mt-3 text-xs">Pilih bukti pembayaran</strong><span className="mt-1 text-[9px] text-slate-400">JPG, PNG, WEBP, atau PDF · Maksimal 5 MB</span></>}{file && <span className="mt-3 flex max-w-full items-center gap-1.5 truncate rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-700"><CheckCircle2 size={12} className="text-emerald-500" />{file.name}</span>}</label>{error && <p role="alert" className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-[10px] leading-4 text-red-600">{error}</p>}</section>
      </>}
      <section className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><ShieldCheck size={20} className="shrink-0 text-emerald-600" /><div><strong className="block text-[10px] text-emerald-900">Transaksi terlindungi</strong><p className="mt-1 text-[9px] leading-4 text-emerald-700">Bukti pembayaran disimpan secara privat dan hanya digunakan untuk verifikasi pesanan.</p></div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><ReceiptText size={16} className="text-primary" /><h2 className="text-xs font-extrabold">Rincian Pembayaran</h2></div><div className="mt-4 space-y-3 text-[10px]"><div className="flex justify-between text-slate-500"><span>Subtotal produk</span><strong className="text-slate-700">{money(subtotal)}</strong></div><div className="flex justify-between text-slate-500"><span>Pengiriman & layanan</span><strong className="text-slate-700">{money(shipping)}</strong></div>{discount > 0 && <div className="flex justify-between text-emerald-600"><span>Potongan promo</span><strong>- {money(discount)}</strong></div>}<div className="flex justify-between border-t border-dashed border-slate-200 pt-4 text-xs"><strong>Total pembayaran</strong><strong className="text-primary">{money(total)}</strong></div></div></section>
    </main>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center gap-3"><div className="hidden min-w-0 flex-1 sm:block"><p className="text-[9px] text-slate-400">Total pembayaran</p><strong className="text-sm">{money(total)}</strong></div>{paymentMode === 'automatic' ? <button type="button" onClick={startAutomaticPayment} disabled={autoLoading} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-orange-500 px-5 text-xs font-extrabold text-white shadow-lg shadow-orange-500/20 transition active:scale-[.99] disabled:opacity-60">{autoLoading ? <Loader2 size={17} className="animate-spin" /> : <Zap size={16} />} {autoLoading ? 'Membuka pembayaran...' : `Bayar Otomatis ${money(total)}`}</button> : <button type="button" onClick={submit} disabled={!file || saving} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-orange-500 px-5 text-xs font-extrabold text-white shadow-lg shadow-orange-500/20 transition active:scale-[.99] disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none">{saving ? <Loader2 size={17} className="animate-spin" /> : <LockKeyhole size={16} />} {saving ? 'Memverifikasi...' : file ? 'Kirim & Verifikasi Pembayaran' : 'Unggah Bukti Terlebih Dahulu'}</button>}</div></div>
  </div>;
}

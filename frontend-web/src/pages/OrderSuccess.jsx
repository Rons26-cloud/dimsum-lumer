import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Copy, Download,
  Fingerprint, Hash, Home, MapPin, PackageCheck, ReceiptText, ShieldCheck,
  ShoppingBag, Truck,
} from 'lucide-react';
import { supabase } from '../supabase/client.js';
import { useOrderRealtime } from '../hooks/useRealtime.js';

const STATUS = {
  pending: { label: 'Menunggu konfirmasi', description: 'Pesanan sudah masuk dan sedang menunggu konfirmasi penjual.', color: 'bg-amber-50 text-amber-700', step: 1 },
  processing: { label: 'Sedang diproses', description: 'Pesanan sedang disiapkan oleh Dimsum Lumer.', color: 'bg-blue-50 text-blue-700', step: 2 },
  shipping: { label: 'Dalam pengiriman', description: 'Pesanan sedang dalam perjalanan menuju lokasimu.', color: 'bg-violet-50 text-violet-700', step: 3 },
  completed: { label: 'Pesanan selesai', description: 'Pesanan sudah diterima. Terima kasih telah berbelanja.', color: 'bg-emerald-50 text-emerald-700', step: 4 },
  cancelled: { label: 'Pesanan dibatalkan', description: 'Pesanan ini telah dibatalkan.', color: 'bg-red-50 text-red-700', step: 0 },
};
const PAYMENT = {
  unpaid: 'Belum dibayar', waiting_verification: 'Menunggu verifikasi',
  paid: 'Sudah dibayar', verified: 'Sudah diverifikasi', failed: 'Pembayaran gagal', refunded: 'Dana dikembalikan',
};
const money = (value) => `Rp${Number(value || 0).toLocaleString('id-ID')}`;
const dateTime = (value) => value ? new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

function InfoRow({ label, value, strong = false }) {
  return <div className="flex items-center justify-between gap-4 py-2.5"><span className="text-[10px] text-slate-400">{label}</span><span className={`max-w-[65%] truncate text-right ${strong ? 'text-sm font-black text-primary' : 'text-[10px] font-bold text-slate-700'}`}>{value || '-'}</span></div>;
}

export default function OrderSuccess() {
  const { state } = useLocation();
  const stateOrderId = state?.orderId;
  const storedOrderId = sessionStorage.getItem('dimsum-lumer-last-order-id');
  const orderId = stateOrderId || storedOrderId;
  const [order, setOrder] = useState(stateOrderId ? { id: stateOrderId, order_code: state.orderCode, total_amount: state.total, payment_status: state.paymentStatus, status: 'pending' } : null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(Boolean(orderId));

  const fetchOrder = useCallback(async () => {
    if (!orderId) { setLoading(false); return; }
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (data) { setOrder(data); sessionStorage.setItem('dimsum-lumer-last-order-id', data.id); }
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);
  useOrderRealtime(orderId, ({ new: nextOrder }) => setOrder(nextOrder));

  const copyCode = async () => {
    if (!order?.order_code) return;
    try { await navigator.clipboard.writeText(order.order_code); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  };

  const status = STATUS[order?.status] || STATUS.pending;
  const paymentStatus = order?.payment_status || state?.paymentStatus || (order?.payment_method === 'cod' ? 'unpaid' : 'unpaid');
  const isWaitingVerification = paymentStatus === 'waiting_verification';
  const isPaid = ['paid', 'verified'].includes(paymentStatus);

  return <div className="min-h-dvh bg-gradient-to-b from-emerald-50/70 via-slate-50 to-slate-100 pb-10 text-slate-900">
    <header className="border-b border-white/70 bg-white/80 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4"><Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600" aria-label="Kembali ke beranda"><Home size={18} /></Link><div className="text-center"><h1 className="text-sm font-extrabold">Konfirmasi Pesanan</h1><p className="text-[9px] text-slate-400">Dimsum Lumer</p></div><span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600"><ShieldCheck size={18} /></span></div></header>

    <main className="mx-auto max-w-xl space-y-4 px-3 py-5 sm:px-5">
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-5 py-7 text-center text-white shadow-xl shadow-emerald-500/20"><div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border-[24px] border-white/10" /><div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-white/10 blur-xl" /><div className="relative"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/15 ring-8 ring-white/10 backdrop-blur"><CheckCircle2 size={43} strokeWidth={2.2} /></span><p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-white/70">Pesanan diterima</p><h2 className="mt-1.5 text-2xl font-black tracking-tight">Pesanan berhasil dibuat!</h2><p className="mx-auto mt-2 max-w-sm text-[10px] leading-5 text-white/80">Terima kasih sudah memesan. Kami akan mengirim pembaruan status secara realtime.</p></div></section>

      {loading && !order ? <section className="animate-pulse rounded-3xl bg-white p-5 shadow-sm"><div className="h-4 w-1/2 rounded bg-slate-100" /><div className="mt-4 h-20 rounded-2xl bg-slate-100" /></section> : order && <>
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="relative overflow-hidden bg-slate-950 p-5 text-white"><div className="absolute -right-10 -top-12 h-32 w-32 rounded-full border-[22px] border-white/5" /><div className="relative"><div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.18em] text-white/50"><Hash size={12} />No. Pesanan</span><span className={`rounded-full px-2.5 py-1 text-[8px] font-extrabold ${status.color}`}>{status.label}</span></div><div className="mt-4 flex items-center justify-between gap-3"><h3 className="min-w-0 break-all font-mono text-base font-black tracking-[.06em] sm:text-lg">{order.order_code || order.id}</h3><button type="button" onClick={copyCode} className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-[9px] font-extrabold text-slate-900 shadow-lg active:scale-95">{copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}{copied ? 'Kode tersalin' : 'Salin'}</button></div><p className="mt-3 text-[9px] leading-4 text-white/50">Gunakan nomor ini saat menghubungi admin atau memeriksa status pesanan.</p></div></div><div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2"><div className="flex items-start gap-3 bg-white p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays size={16} /></span><div className="min-w-0"><p className="text-[9px] text-slate-400">Tanggal pesanan</p><strong className="mt-1 block text-[10px] leading-4 text-slate-700">{dateTime(order.created_at)}</strong></div></div><div className="flex items-start gap-3 bg-white p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><Fingerprint size={16} /></span><div className="min-w-0"><p className="text-[9px] text-slate-400">ID referensi transaksi</p><strong className="mt-1 block truncate font-mono text-[10px] text-slate-700" title={order.id}>{order.id}</strong></div></div></div><div className="px-5 pb-5"><div className="border-t border-dashed border-slate-200 pt-2"><InfoRow label="Total pembayaran" value={money(order.total_amount || order.total_price || order.total)} strong /><InfoRow label="Metode pembayaran" value={String(order.payment_method || 'Belum dipilih').toUpperCase()} /><InfoRow label="Status pembayaran" value={PAYMENT[paymentStatus] || paymentStatus} /></div><div className="mt-2 flex items-center justify-between rounded-2xl bg-slate-50 p-3"><div className="min-w-0"><p className="text-[9px] text-slate-400">Informasi status</p><p className="mt-1 text-[10px] font-bold leading-4 text-slate-600">{status.description}</p></div></div></div></section>

        {(isWaitingVerification || isPaid) && <section className={`flex gap-3 rounded-2xl border p-4 ${isPaid ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>{isPaid ? <ShieldCheck size={19} /> : <Clock3 size={19} />}</span><div><strong className={`block text-[11px] ${isPaid ? 'text-emerald-900' : 'text-amber-900'}`}>{isPaid ? 'Pembayaran berhasil' : 'Bukti sedang diverifikasi'}</strong><p className={`mt-1 text-[9px] leading-4 ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>{isPaid ? 'Pembayaran telah diterima dan pesanan siap diproses.' : 'Bukti pembayaran sudah terkirim. Admin akan memeriksa dan memperbarui statusnya.'}</p></div></section>}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-sm font-extrabold">Proses pesanan</h3><p className="mt-0.5 text-[9px] text-slate-400">Status diperbarui otomatis</p></div><span className="flex items-center gap-1 text-[8px] font-bold text-emerald-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />REALTIME</span></div><div className="mt-5 grid grid-cols-4"><Step icon={ReceiptText} label="Diterima" active={status.step >= 1} /><Step icon={PackageCheck} label="Diproses" active={status.step >= 2} /><Step icon={Truck} label="Dikirim" active={status.step >= 3} /><Step icon={CheckCircle2} label="Selesai" active={status.step >= 4} last /></div></section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-sm font-extrabold">Langkah berikutnya</h3><div className="mt-4 space-y-3"><NextStep number="1" text={isWaitingVerification ? 'Tunggu admin memverifikasi bukti pembayaran.' : isPaid ? 'Pesanan akan segera disiapkan oleh penjual.' : order.payment_method === 'cod' ? 'Siapkan pembayaran saat pesanan tiba.' : 'Selesaikan pembayaran sesuai metode yang dipilih.'} /><NextStep number="2" text="Pantau proses dan posisi pesanan melalui halaman pelacakan." /><NextStep number="3" text="Pastikan nomor telepon aktif agar kurir mudah menghubungi." /></div></section>
      </>}

      {!order && !loading && <section className="rounded-3xl border border-amber-100 bg-white p-6 text-center shadow-sm"><ShoppingBag size={32} className="mx-auto text-slate-300" /><h3 className="mt-3 text-sm font-extrabold">Detail pesanan tidak tersedia</h3><p className="mt-1 text-[10px] leading-5 text-slate-400">Pesanan tetap dapat dilihat melalui halaman riwayat pesanan.</p></section>}

      <div className="grid grid-cols-1 gap-2 xs:grid-cols-2">{orderId && <Link to={`/lacak-pesanan/${orderId}`} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-extrabold text-white shadow-lg shadow-orange-500/20"><MapPin size={16} />Lacak Pesanan<ArrowRight size={14} /></Link>}<Link to="/orders" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700 shadow-sm"><ReceiptText size={15} />Pesanan Saya</Link></div>
      {state?.proofUrl && <a href={state.proofUrl} target="_blank" rel="noopener noreferrer" download className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-orange-50 text-[10px] font-bold text-primary"><Download size={14} />Lihat bukti pembayaran</a>}
      <Link to="/" className="flex min-h-11 w-full items-center justify-center gap-2 text-[10px] font-bold text-slate-400"><Home size={14} />Kembali belanja</Link>
    </main>
  </div>;
}

function Step({ icon: Icon, label, active, last = false }) {
  return <div className="relative text-center"><div className={`relative z-10 mx-auto grid h-9 w-9 place-items-center rounded-full ${active ? 'bg-primary text-white shadow-md shadow-orange-200' : 'bg-slate-100 text-slate-300'}`}><Icon size={15} /></div>{!last && <span className={`absolute left-[62%] top-4 h-0.5 w-[76%] ${active ? 'bg-primary' : 'bg-slate-100'}`} />}<p className={`mt-2 text-[8px] font-bold ${active ? 'text-slate-700' : 'text-slate-300'}`}>{label}</p></div>;
}

function NextStep({ number, text }) {
  return <div className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-900 text-[9px] font-black text-white">{number}</span><p className="pt-1 text-[10px] leading-4 text-slate-500">{text}</p></div>;
}

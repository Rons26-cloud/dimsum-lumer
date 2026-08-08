import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Download, MapPin, ReceiptText } from 'lucide-react';
import { supabase } from '../supabase/client.js';
import { useOrderRealtime } from '../hooks/useRealtime.js';
import Button from '../components/ui/Button.jsx';

const STATUS_LABEL = { pending: 'Menunggu konfirmasi', processing: 'Sedang diproses', shipping: 'Dalam pengiriman', completed: 'Pesanan selesai', cancelled: 'Pesanan dibatalkan' };

export default function OrderSuccess() {
  const { state } = useLocation();
  const orderId = state?.orderId;
  const [order, setOrder] = useState(state ? { id: orderId, order_code: state.orderCode, total: state.total, status: 'pending' } : null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (data) setOrder(data);
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);
  useOrderRealtime(orderId, ({ new: nextOrder }) => setOrder(nextOrder));

  return (
    <div className="min-h-dvh bg-gray-50 px-4 py-10 sm:py-14">
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-100 shadow-card p-5 sm:p-7 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mx-auto"><CheckCircle2 size={34} /></div>
        <h1 className="text-xl font-extrabold mt-4">Pesanan berhasil dibuat!</h1>
        <p className="text-gray-500 text-xs mt-2">Pesanan sudah diterima dan akan diperbarui otomatis.</p>
        {state?.paymentStatus === 'waiting_verification' && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[10px] font-semibold text-amber-700">Bukti pembayaran sudah dikirim. Tinggal menunggu verifikasi penjual.</p>}

        {order && <div className="mt-6 text-left rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3"><span className="text-[10px] text-gray-400">Kode pesanan</span><strong className="text-xs">{order.order_code || '-'}</strong></div>
          <div className="flex items-center justify-between gap-3"><span className="text-[10px] text-gray-400">Total pembayaran</span><strong className="text-sm text-primary">Rp{Number(order.total || 0).toLocaleString('id-ID')}</strong></div>
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">{STATUS_LABEL[order.status] || order.status}</span></div>
        </div>}

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mt-5">
          {orderId && <Link to={`/lacak-pesanan/${orderId}`}><Button className="w-full"><MapPin size={15} /> Lacak Pesanan</Button></Link>}
          <Link to="/profil"><Button variant="outline" className="w-full"><ReceiptText size={15} /> Pesanan Saya</Button></Link>
        </div>
        {state?.proofUrl&&<a href={state.proofUrl} target="_blank" rel="noopener noreferrer" download className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 text-[10px] font-bold text-primary"><Download size={14}/>Lihat / Unduh Bukti Pembayaran</a>}
        <Link to="/" className="inline-block mt-5 text-xs font-semibold text-gray-500 hover:text-primary">Kembali ke beranda</Link>
      </div>
    </div>
  );
}

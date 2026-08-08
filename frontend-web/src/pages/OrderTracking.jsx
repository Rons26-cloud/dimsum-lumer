import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Loader2, MapPin, MessageSquare, Navigation, Radio, Square } from 'lucide-react';
import { supabase } from '../supabase/client';
import { useOrderRealtime } from '../hooks/useRealtime';
import { useLiveGeolocation } from '../hooks/useLiveGeolocation';

const STATUS_LABEL = { pending: 'Menunggu konfirmasi', processing: 'Sedang diproses', shipping: 'Dalam pengiriman', completed: 'Selesai', cancelled: 'Dibatalkan' };
const TRACKING_STEPS = [['pending','Konfirmasi'],['processing','Diproses'],['shipping','Dikirim'],['completed','Selesai']];

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const lastSync = useRef(0);
  const { coords, status: gpsStatus, error: gpsError, start, stop } = useLiveGeolocation();
  const adminWhatsApp = import.meta.env.VITE_ADMIN_WA_NUMBER || '';

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    setOrder(data || null);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);
  useOrderRealtime(orderId, ({ new: nextOrder }) => setOrder(nextOrder));

  useEffect(() => {
    if (!coords || !orderId || Date.now() - lastSync.current < 5000) return;
    lastSync.current = Date.now();
    setSyncing(true);
    supabase.rpc('update_own_order_location', {
      p_order_id: orderId,
      p_latitude: coords.lat,
      p_longitude: coords.lng,
      p_accuracy: coords.accuracy || 0,
    }).then(({ error }) => {
      setSyncing(false);
      if (error) console.error('GPS sync failed:', error.message);
    });
  }, [coords, orderId]);

  const sendWhatsApp = () => {
    const lat = coords?.lat || order?.delivery_latitude;
    const lng = coords?.lng || order?.delivery_longitude;
    if (!lat || !lng || !adminWhatsApp) return;
    const text = encodeURIComponent(`Halo Admin Dimsum Lumer, ini lokasi pesanan ${order.order_code}: https://www.google.com/maps?q=${lat},${lng}`);
    window.open(`https://wa.me/${adminWhatsApp}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!order) return <div className="text-center py-12 text-gray-500">Pesanan tidak ditemukan atau bukan milik Anda.</div>;
  const lat = coords?.lat || order.delivery_latitude;
  const lng = coords?.lng || order.delivery_longitude;
  const sharing = gpsStatus === 'loading' || gpsStatus === 'success';
  const activeStep = TRACKING_STEPS.findIndex(([value]) => value === order.status);

  return (
    <div className="max-w-2xl mx-auto px-3 xs:px-4 py-5 pb-24 space-y-4">
      <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-card border border-gray-100">
        <div className="flex justify-between items-start gap-3 border-b border-gray-100 pb-4"><div><span className="text-[10px] text-gray-400">No. Pesanan</span><h1 className="font-extrabold text-lg">{order.order_code || order.id}</h1></div><span className="px-3 py-1 rounded-full text-[10px] font-bold bg-primary-50 text-primary">{STATUS_LABEL[order.status] || order.status}</span></div>
        <div className="mt-4 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3"><Radio className={`text-emerald-600 ${sharing ? 'animate-pulse' : ''}`} size={21} /><div><p className="text-xs font-bold text-emerald-800">{sharing ? 'GPS live sedang dibagikan' : 'GPS live belum aktif'}</p><p className="text-[10px] text-emerald-600">{syncing ? 'Menyinkronkan titik terbaru…' : 'Update maksimal setiap 5 detik saat posisi berubah.'}</p></div></div>

        <div className="mt-4 grid grid-cols-4 gap-1" aria-label="Progres pesanan">{TRACKING_STEPS.map(([value,label],index)=><div key={value} className="text-center"><div className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${order.status!=='cancelled'&&index<=activeStep?'bg-primary text-white':'bg-gray-100 text-gray-400'}`}>{index+1}</div><div className={`mt-1 h-1 rounded ${order.status!=='cancelled'&&index<=activeStep?'bg-primary':'bg-gray-100'}`}/><span className="mt-1 block text-[9px] text-gray-500">{label}</span></div>)}</div>
        {order.status==='cancelled'&&<p className="mt-3 rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">Pesanan dibatalkan</p>}
        <div className="mt-4 h-48 rounded-2xl bg-gradient-to-br from-gray-100 to-primary-50 border border-gray-100 relative overflow-hidden grid place-items-center text-center">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#FF7A00_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="relative"><MapPin className="text-primary mx-auto" size={38} /><p className="text-xs font-semibold mt-2">Titik pengiriman</p><span className="text-[10px] text-gray-500">{lat && lng ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : 'Belum ada koordinat'}</span>{coords?.accuracy && <p className="text-[9px] text-gray-400">Akurasi ±{Math.round(coords.accuracy)} meter</p>}</div>
        </div>
        {gpsError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-[10px] text-red-700">{gpsError}</p>}

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mt-4">
          <button onClick={sharing ? stop : start} disabled={['completed','cancelled'].includes(order.status)} className={`min-h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${sharing ? 'border border-red-200 text-red-600' : 'bg-primary text-white'} disabled:opacity-40`}>{sharing ? <><Square size={14} /> Hentikan GPS</> : <><Navigation size={15} /> Aktifkan GPS Live</>}</button>
          <button onClick={sendWhatsApp} disabled={!lat || !lng || !adminWhatsApp} className="min-h-11 rounded-xl bg-emerald-600 disabled:bg-gray-200 text-white text-xs font-bold flex items-center justify-center gap-2"><MessageSquare size={15} /> Kirim ke WhatsApp</button>
        </div>
        {lat && lng && <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer" className="mt-3 min-h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center gap-2 text-[10px] font-semibold"><ExternalLink size={13} /> Buka Google Maps</a>}
      </section>
    </div>
  );
}

import { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo.jsx';
import qrisPlaceholder from '../../assets/payment/qris-placeholder.jpg';

const methods = [
  { id:'transfer', name:'Transfer BCA', brand:'bca' }, { id:'qris', name:'QRIS', brand:'qris' },
  { id:'gopay', name:'GoPay', brand:'gopay' }, { id:'ovo', name:'OVO', brand:'ovo' },
  { id:'shopeepay', name:'ShopeePay', brand:'shopeepay' }, { id:'dana', name:'DANA', brand:'dana' },
  { id:'cod', name:'Bayar di Tempat', brand:'cod' },
];

export function PaymentMethodSection({ paymentMethod, setPaymentMethod, isAgreed, setIsAgreed }) {
  const [detail,setDetail] = useState(null);
  const choose = (method) => { setPaymentMethod(method.id); setDetail(method); };
  const seller = { bank:import.meta.env.VITE_SELLER_BANK || 'BCA', account:import.meta.env.VITE_SELLER_ACCOUNT || '1234567890', owner:import.meta.env.VITE_SELLER_NAME || 'DIMSUM LUMER', phone:import.meta.env.VITE_SELLER_WALLET || import.meta.env.VITE_ADMIN_WA_NUMBER || '08xxxxxxxxxx', qrisImage:import.meta.env.VITE_SELLER_QRIS_IMAGE || qrisPlaceholder, hasRealQris:Boolean(import.meta.env.VITE_SELLER_QRIS_IMAGE) };
  return <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card sm:p-5">
    <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-dark">5. Metode Pembayaran</h2><span className="text-right text-[9px] text-gray-400">Tekan logo untuk detail</span></div>
    <div className="my-4 grid grid-cols-4 gap-2 sm:grid-cols-7">{methods.map((method) => <button title={method.name} aria-label={method.name} type="button" key={method.id} onClick={() => choose(method)} className={`grid h-12 min-w-0 place-items-center rounded-xl border px-1 transition-colors ${paymentMethod === method.id ? 'border-primary bg-primary-50 shadow-sm' : 'border-gray-100 bg-gray-50'}`}><BrandLogo brand={method.brand}/></button>)}</div>
    <p className="mb-4 text-[10px] text-gray-500">Dipilih: <strong className="text-primary">{methods.find((method) => method.id === paymentMethod)?.name}</strong></p>
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-[10px] leading-relaxed text-gray-500"><input type="checkbox" checked={isAgreed} onChange={(event) => setIsAgreed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary"/><span>Saya menyetujui <a href="#terms" className="font-semibold text-primary">Syarat & Ketentuan</a> serta <a href="/profil/informasi/privasi" target="_blank" rel="noreferrer" className="font-semibold text-primary">Kebijakan Privasi</a>.</span></label>
    {detail && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"><div className="w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"><button onClick={() => setDetail(null)} className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500" aria-label="Tutup"><X size={15}/></button><div className="text-center"><span className="mx-auto grid h-14 w-24 place-items-center rounded-2xl bg-gray-50"><BrandLogo brand={detail.brand} className="scale-110"/></span><h3 className="mt-3 text-sm font-bold">{detail.name}</h3>
      {detail.id === 'transfer' && <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-left text-xs"><p className="text-gray-400">Rekening penjual</p><strong className="mt-1 block text-lg text-dark">{seller.bank} · {seller.account}</strong><p className="mt-1 text-gray-500">a.n. {seller.owner}</p></div>}
      {detail.id === 'qris' && <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-xs text-gray-500"><img src={seller.qrisImage} alt={seller.hasRealQris?'Kode QRIS penjual':'Placeholder QRIS penjual'} className="mx-auto aspect-square w-48 rounded-xl bg-white object-contain p-2"/>{!seller.hasRealQris&&<p className="mt-3 text-center text-amber-600">Admin harus memasang gambar QRIS asli sebelum menerima pembayaran.</p>}</div>}
      {detail.id === 'cod' && <p className="mt-4 rounded-2xl bg-gray-50 p-4 text-xs text-gray-500">Siapkan pembayaran saat pesanan diterima atau diambil di toko.</p>}
      {!['transfer','qris','cod'].includes(detail.id) && <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-left text-xs"><p className="text-gray-400">Nomor akun penjual</p><strong className="mt-1 block text-lg text-dark">{seller.phone}</strong><p className="mt-1 text-gray-500">a.n. {seller.owner}</p></div>}
      <button onClick={() => setDetail(null)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white"><CheckCircle size={15}/> Gunakan Metode Ini</button></div></div></div>}
  </section>;
}

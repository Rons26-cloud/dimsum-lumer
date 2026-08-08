import { Clock3 } from 'lucide-react';
import { BrandLogo } from './BrandLogo.jsx';

const methods = [
  { id:'gojek', brand:'gojek', name:'GoSend by Gojek', eta:'30–60 menit', price:15000 },
  { id:'grab', brand:'grab', name:'GrabExpress', eta:'30–60 menit', price:17000 },
  { id:'pickup', brand:'cod', name:'COD / Ambil Sendiri', eta:'Sesuai jam operasional', price:0 },
];

export function ShippingMethodSection({ shippingMethod, setShippingMethod }) {
  return <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card sm:p-5">
    <h2 className="mb-4 text-sm font-bold text-dark">4. Metode Pengiriman</h2>
    <div className="space-y-2.5">{methods.map(({ id, brand, name, eta, price }) => (
      <button type="button" key={id} onClick={() => setShippingMethod(id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${shippingMethod === id ? 'border-primary bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
        <span className="grid h-11 w-[76px] shrink-0 place-items-center rounded-xl bg-white px-2 shadow-sm"><BrandLogo brand={brand} /></span>
        <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-gray-800">{name}</strong><span className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400"><Clock3 size={11}/>{eta}</span></span>
        <strong className="shrink-0 text-[11px] text-gray-700">{price ? `Rp${price.toLocaleString('id-ID')}` : 'Gratis'}</strong>
      </button>
    ))}</div>
  </section>;
}

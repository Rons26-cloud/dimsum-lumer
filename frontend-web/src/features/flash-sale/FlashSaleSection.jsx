import { useEffect, useMemo, useState } from 'react';
import { Clock, Zap } from 'lucide-react';
import { useFlashSales } from './useFlashSales.js';
import { FlashSaleCard } from './FlashSaleCard.jsx';

export default function FlashSaleSection() {
  const sales = useFlashSales();
  const [,tick] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => tick((value) => value + 1),1000); return () => window.clearInterval(timer); },[]);
  const active = useMemo(() => (sales || []).filter((sale) => new Date(sale.starts_at || 0) <= new Date() && new Date(sale.ends_at).getTime() > Date.now() && Number(sale.flash_stock) > 0),[sales,tick]);
  const end = active[0]?.ends_at ? Math.max(0,new Date(active[0].ends_at).getTime() - Date.now()) : 0;
  const time = { h:Math.floor(end/3600000), m:Math.floor(end/60000)%60, s:Math.floor(end/1000)%60 };
  return <section className="mt-4 px-3 xs:px-4"><div className="mx-auto max-w-7xl space-y-3"><div className="flex items-center justify-between"><h2 className="flex items-center gap-1 text-sm font-bold text-dark sm:text-base"><Zap size={13} className="fill-primary text-primary"/> Flash Sale</h2><div className="flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-[10px] font-bold text-primary"><Clock size={10}/>{String(time.h).padStart(2,'0')}:{String(time.m).padStart(2,'0')}:{String(time.s).padStart(2,'0')}</div></div><div className="grid grid-cols-3 items-stretch gap-1.5 xs:gap-2 sm:grid-cols-3 lg:grid-cols-4">{active.map((sale) => <FlashSaleCard key={sale.id} sale={sale}/>)}</div></div></section>;
}


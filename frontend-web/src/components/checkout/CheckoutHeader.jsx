import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import logo from '../../assets/logo/logo.png';

export function CheckoutHeader() {
  return <header className="sticky top-0 z-30 h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 border-b border-gray-100 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:h-[calc(4rem+env(safe-area-inset-top))]"><div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:h-16"><Link to="/" className="flex min-w-0 items-center gap-2"><img src={logo} alt="Dimsum Lumer" className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"/><span className="truncate text-sm font-extrabold leading-tight text-primary sm:text-base">Dimsum Lumer</span></Link><span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/10 bg-primary-50 px-2.5 py-1.5 text-[9px] font-semibold text-primary sm:px-3 sm:text-[10px]"><ShieldCheck size={14}/> Checkout Aman</span></div></header>;
}


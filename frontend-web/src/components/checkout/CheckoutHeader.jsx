import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import logo from '../../assets/logo/logo.png';

export function CheckoutHeader() {
  return <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-gray-100 bg-white sm:h-16"><div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-3 sm:px-4"><Link to="/" className="flex min-w-0 items-center gap-2"><img src={logo} alt="Dimsum Lumer" className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-10 sm:w-10"/><span className="truncate text-sm font-extrabold leading-tight text-primary sm:text-base">Dimsum Lumer</span></Link><span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/10 bg-primary-50 px-2.5 py-1.5 text-[9px] font-semibold text-primary sm:px-3 sm:text-[10px]"><ShieldCheck size={14}/> Checkout Aman</span></div></header>;
}


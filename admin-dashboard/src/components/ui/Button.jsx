import { Loader2 } from 'lucide-react';

const variants={primary:'bg-primary text-white hover:bg-primary-600',outline:'border border-primary text-primary hover:bg-primary-50',danger:'bg-red-600 text-white hover:bg-red-700',ghost:'text-gray-600 hover:bg-gray-100'};
export default function Button({children,variant='primary',loading=false,disabled=false,type='button',className='',...props}){
  return <button type={type} disabled={disabled||loading} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]||variants.primary} ${className}`} {...props}>{loading&&<Loader2 size={15} className="animate-spin"/>}{children}</button>;
}

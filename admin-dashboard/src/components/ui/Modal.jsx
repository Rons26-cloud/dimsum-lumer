import { X } from 'lucide-react';
export default function Modal({open,title,onClose,children,className=''}){
  if(!open)return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose?.();}}><div className={`max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl ${className}`}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-bold text-gray-900">{title}</h2><button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500" aria-label="Tutup"><X size={16}/></button></div>{children}</div></div>;
}

import { X } from 'lucide-react';
export default function Drawer({open,title,onClose,children,side='right'}){
  if(!open)return null;
  return <div className="fixed inset-0 z-50 bg-black/40" role="dialog" aria-modal="true"><button className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} aria-label="Tutup drawer"/><aside className={`absolute top-0 h-full w-[min(92vw,420px)] overflow-y-auto bg-white p-5 shadow-2xl ${side==='left'?'left-0':'right-0'}`}><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{title}</h2><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-gray-100" aria-label="Tutup"><X size={16}/></button></div>{children}</aside></div>;
}

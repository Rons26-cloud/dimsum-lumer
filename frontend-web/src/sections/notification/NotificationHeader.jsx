import { ArrowLeft, CheckCheck, Settings, Trash2 } from "lucide-react";

export default function NotificationHeader({ onBack, onReadAll, onDeleteAll, unreadCount }) {
  const openSettings=()=>document.getElementById('notification-permission')?.scrollIntoView({behavior:'smooth',block:'center'});
  return <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-end gap-0.5 border-b border-gray-100 bg-white/95 px-2 pb-2 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:h-[calc(4rem+env(safe-area-inset-top))] sm:px-3 sm:pb-3">
    <button type="button" onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full hover:bg-gray-50" aria-label="Kembali"><ArrowLeft size={20}/></button>
    <div className="min-w-0 flex-1 self-center"><h1 className="text-base font-extrabold leading-tight">Notifikasi</h1><p className="text-[9px] text-gray-400">{unreadCount} belum dibaca</p></div>
    <button type="button" onClick={onReadAll} disabled={!unreadCount} className="grid h-10 w-10 place-items-center rounded-full text-primary disabled:text-gray-300" aria-label="Tandai semua sudah dibaca"><CheckCheck size={18}/></button>
    <button type="button" onClick={openSettings} className="grid h-10 w-10 place-items-center rounded-full hover:bg-gray-50" aria-label="Pengaturan notifikasi"><Settings size={18}/></button>
    <button type="button" onClick={onDeleteAll} className="grid h-10 w-10 place-items-center rounded-full text-red-500 hover:bg-red-50" aria-label="Hapus semua"><Trash2 size={18}/></button>
  </header>;
}

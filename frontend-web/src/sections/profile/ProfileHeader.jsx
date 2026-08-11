import { Bell, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBadge from "../../components/notification/NotificationBadge.jsx";

export default function ProfileHeader({ unreadCount,onNotifications }) {
  const navigate=useNavigate();
  return <header className="relative z-10 -mx-3 flex h-14 items-center border-b border-slate-200 bg-white px-4 sm:h-16"><div className="min-w-0 flex-1"><h1 className="text-base font-bold leading-tight text-dark">Akun</h1><p className="truncate text-[10px] text-slate-500">Kelola profil dan aktivitas akun</p></div><button onClick={onNotifications} className="relative grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-dark active:bg-primary-50 active:text-primary" aria-label="Notifikasi"><Bell size={18}/><NotificationBadge count={unreadCount}/></button><button onClick={()=>navigate('/profil/pengaturan-notifikasi')} className="ml-2 grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-dark active:bg-primary-50 active:text-primary" aria-label="Pengaturan notifikasi"><Settings size={18}/></button></header>;
}

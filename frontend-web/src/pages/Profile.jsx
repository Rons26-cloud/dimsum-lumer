import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CircleHelp, CreditCard, Gift, Heart, HelpCircle, History, Info, Languages, LogOut, MapPin, Package, Settings, ShieldCheck, Star, Tag } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useProfile } from "../hooks/useProfile.js";
import { usePoint } from "../hooks/usePoint.js";
import { useNotifications } from "../hooks/useNotifications.js";
import { useWishlist } from "../hooks/useWishlist.js";
import { useLiveCollection } from "../hooks/useLiveCollection.js";
import { TABLES } from "../supabase/constants.js";
import { signOut } from "../services/authService.js";
import ProfileHeader from "../sections/profile/ProfileHeader.jsx";
import GuestCard from "../sections/profile/GuestCard.jsx";
import MemberCard from "../sections/profile/MemberCard.jsx";
import PointProgressSection from "../sections/profile/PointProgressSection.jsx";
import OrderStatusSection from "../sections/profile/OrderStatusSection.jsx";
import AccountMenuSection from "../sections/profile/AccountMenuSection.jsx";
import LogoutSection from "../sections/profile/LogoutSection.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Profile() {
  const navigate=useNavigate();const {user,loading:authLoading}=useAuth();const {profile,loading:profileLoading}=useProfile();const summary=usePoint(profile?.point ?? 0);const {unreadCount}=useNotifications();const {ids}=useWishlist();const rewards=useLiveCollection(TABLES.REWARDS);const [confirmLogout,setConfirmLogout]=useState(false);const {language,t}=useLanguage();
  const go=(path)=>()=>navigate(path);
  const primary=[
    {icon:Package,title:'Pesanan Saya',subtitle:`${summary.orders.total} total pesanan`,onClick:go('/orders')},
    {icon:Heart,title:'Favorit',subtitle:`${ids.size} produk tersimpan`,onClick:go('/wishlist')},
    {icon:MapPin,title:'Alamat Saya',subtitle:'Kelola alamat pengiriman',onClick:go('/profil/alamat')},
    {icon:Star,title:'Poin Saya',subtitle:`${summary.point.toLocaleString('id-ID')} poin tersedia`,onClick:go('/profil/poin')},
    {icon:History,title:'Riwayat Poin',subtitle:'Aktivitas perolehan dan penukaran',onClick:go('/profil/riwayat-poin')},
    {icon:Gift,title:'Reward',subtitle:`${Array.isArray(rewards)?rewards.length:0} reward tersedia`,onClick:go('/profil/reward')},
    {icon:Tag,title:'Kupon Saya',subtitle:'Promo dan voucher aktif',onClick:go('/promo')},
    {icon:CreditCard,title:'Metode Pembayaran',subtitle:'Rekening bank dan dompet digital',onClick:go('/profil/metode-pembayaran')},
    {icon:Bell,title:'Notifikasi',subtitle:`${unreadCount} belum dibaca`,onClick:go('/notifikasi')},
  ];
  const information=[
    {icon:Languages,title:t('language.title'),subtitle:language==='en'?'English':'Bahasa Indonesia',onClick:go('/profil/detail?section=language')},
    {icon:CircleHelp,title:'Bantuan',subtitle:'Hubungi layanan pelanggan',onClick:go('/profil/informasi/bantuan')},
    {icon:HelpCircle,title:'FAQ',subtitle:'Pertanyaan yang sering diajukan',onClick:go('/profil/informasi/faq')},
    {icon:ShieldCheck,title:'Kebijakan Privasi',subtitle:'Perlindungan dan penggunaan data',onClick:go('/profil/informasi/privasi')},
    {icon:Info,title:'Tentang Kami',subtitle:'Cerita, visi, misi, dan nilai kami',onClick:go('/profil/informasi/tentang')},
    {icon:Settings,title:'Pengaturan',subtitle:'Profil dan preferensi akun',onClick:go('/profil/detail')},
  ];
  const logout=async()=>{await signOut();setConfirmLogout(false);navigate('/');};
  if(authLoading||user&&profileLoading)return <div className="mx-auto max-w-2xl space-y-3 p-3"><div className="h-16 animate-pulse rounded-2xl bg-white"/><div className="h-40 animate-pulse rounded-3xl bg-orange-100"/><div className="h-48 animate-pulse rounded-3xl bg-white"/></div>;
  return <div className="mx-auto w-full max-w-2xl space-y-3 bg-white"><ProfileHeader unreadCount={unreadCount} onNotifications={go('/notifikasi')} onSettings={go('/profil/detail')}/><div className="space-y-3">{!user?<GuestCard onLogin={go('/login')}/>:<><MemberCard profile={profile} user={user} onClick={go('/profil/detail')}/><PointProgressSection point={summary.point} orders={summary.orders} progress={summary.progress}/><OrderStatusSection orders={summary.orders} userId={user.id} onSelect={(status)=>navigate(`/orders${status==='all'?'':`?status=${status}`}`)}/><AccountMenuSection items={primary}/><AccountMenuSection title={t('profile.informationSettings')} items={information}/><LogoutSection onLogout={()=>setConfirmLogout(true)}/></>}</div>{confirmLogout&&<div className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-3 sm:place-items-center"><div className="w-full max-w-sm rounded-3xl bg-white p-5"><LogOut className="text-red-500"/><h2 className="mt-3 text-sm font-extrabold">Keluar dari akun?</h2><p className="mt-1 text-[10px] text-gray-500">Sesi akun pada perangkat ini akan dihentikan.</p><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={()=>setConfirmLogout(false)} className="h-11 rounded-xl bg-gray-100 text-xs font-bold">Batal</button><button onClick={logout} className="h-11 rounded-xl bg-red-600 text-xs font-bold text-white">Keluar</button></div></div></div>}</div>;
}

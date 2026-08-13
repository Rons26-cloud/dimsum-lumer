import { useEffect, useState } from "react";
import { Building2, Home, Loader2, MapPin, MessageCircle, Navigation, Phone, Star } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { getAddresses } from "../services/addressService.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import ProfilePageHeader from "../components/profile/ProfilePageHeader.jsx";

const value = (text) => text?.trim?.() || "Belum tersedia";
const whatsappUrl = (number) => {
  const clean = String(number || "").replace(/\D/g, "").replace(/^0/, "62");
  return clean ? `https://wa.me/${clean}` : "";
};

function AddressCard({ address }) {
  const lat = Number(address.latitude);
  const lng = Number(address.longitude);
  const hasMap = Number.isFinite(lat) && Number.isFinite(lng);
  const phone = address.whatsapp || address.phone_number || address.phone;
  const rows = [
    ["Provinsi", address.province],
    ["Kabupaten/Kota", address.regency || address.city],
    ["Kecamatan", address.district],
    ["Desa/Kelurahan", address.village],
    ["Kode Pos", address.postal_code],
  ];

  return <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
    <div className="relative h-48 bg-slate-100">
      {hasMap ? <iframe title={`Peta ${address.label || "alamat"}`} src={`https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/> : <div className="grid h-full place-items-center text-center text-slate-400"><div><MapPin className="mx-auto"/><p className="mt-2 text-xs font-semibold">Titik GPS belum tersimpan</p></div></div>}
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold text-slate-900 shadow-md backdrop-blur"><Home size={13}/>{address.label || "Alamat"}</span>
      {address.is_primary && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-[9px] font-extrabold text-white shadow-md"><Star size={11} fill="currentColor"/>Utama</span>}
    </div>
    <div className="space-y-5 p-5">
      <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-500">Penerima</p><h2 className="mt-1 text-base font-black text-slate-950">{value(address.recipient_name)}</h2><p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-600"><MapPin size={15} className="mt-0.5 shrink-0 text-orange-500"/>{value(address.full_address)}</p>{address.landmark&&<p className="mt-2 flex items-center gap-2 text-[10px] text-slate-400"><Navigation size={13}/>{address.landmark}</p>}</div>
      <dl className="grid grid-cols-2 gap-2">{rows.map(([label,text])=><div key={label} className="rounded-2xl bg-slate-50 p-3"><dt className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-xs font-extrabold leading-4 text-slate-800">{value(text)}</dd></div>)}</dl>
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Kontak WhatsApp</p><div className="mt-2 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm"><MessageCircle size={19}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-emerald-950">{value(phone)}</p><p className="text-[9px] text-emerald-700/60">Digunakan untuk koordinasi pengiriman</p></div>{whatsappUrl(phone)&&<a href={whatsappUrl(phone)} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white" aria-label="Buka WhatsApp"><Phone size={17}/></a>}</div></div>
      {hasMap&&<a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 text-xs font-extrabold text-white"><Navigation size={16}/>Buka lokasi di Google Maps</a>}
    </div>
  </article>;
}

export default function Address() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState(null);
  useEffect(() => { if (user) getAddresses(user.id).then(setAddresses).catch(() => setAddresses([])); }, [user]);
  return <div className="space-y-4"><ProfilePageHeader title="Alamat Saya"/>
    <section className="rounded-3xl bg-slate-950 p-5 text-white"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500"><Building2 size={20}/></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-300">Alamat Pengiriman</p><h1 className="mt-1 text-lg font-black">Alamat tersimpan Anda</h1></div></div><p className="mt-3 text-xs leading-5 text-white/60">Cek titik peta dan nomor WhatsApp agar kurir lebih mudah menemukan lokasi Anda.</p></section>
    {addresses===null?<div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-primary"/></div>:addresses.length===0?<EmptyState icon={MapPin} title="Belum ada alamat tersimpan" description="Tambahkan alamat melalui halaman checkout saat membuat pesanan."/>:<section className="grid gap-4">{addresses.map(address=><AddressCard key={address.id} address={address}/>)}</section>}
  </div>;
}

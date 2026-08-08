import { LogOut } from "lucide-react";
export default function LogoutSection({ onLogout }) { return <section className="rounded-2xl border border-red-100 bg-white p-2.5"><button onClick={onLogout} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-[10px] font-extrabold text-red-600"><LogOut size={15}/>Keluar dari Akun</button></section>; }

import { Clock3 } from "lucide-react";
export default function NotificationTime({ value, className = "text-slate-500" }) {
  if (!value) return null;
  const date = new Date(value);
  const relative = Math.max(0, Date.now() - date.getTime());
  const text = relative < 60000 ? "Baru saja" : relative < 3600000 ? `${Math.floor(relative / 60000)} menit lalu` : relative < 86400000 ? `${Math.floor(relative / 3600000)} jam lalu` : date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  return <span className={`flex items-center gap-1 text-[9px] font-medium ${className}`}><Clock3 size={10} />{text}</span>;
}

export default function NotificationStatus({ read }) {
  return read ? <span className="text-[9px] font-semibold text-gray-400">Dibaca</span> : <span className="flex items-center gap-1 text-[9px] font-bold text-primary"><i className="h-2 w-2 rounded-full bg-primary" />Baru</span>;
}

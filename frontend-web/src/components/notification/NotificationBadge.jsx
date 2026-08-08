export default function NotificationBadge({ count = 0 }) {
  if (!count) return null;
  return <span className="absolute -right-1 -top-1 grid min-h-[17px] min-w-[17px] place-items-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-white">{count > 99 ? "99+" : count}</span>;
}

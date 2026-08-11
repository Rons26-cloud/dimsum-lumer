import { Bell, CircleAlert, Gift, PackageCheck, ShieldCheck, ShoppingBag, Sparkles, Star, Store, Tag, Truck, UserRound, WalletCards, Wrench } from "lucide-react";

const icons = { order: ShoppingBag, order_confirmed: PackageCheck, order_processing: PackageCheck, driver_assigned: Truck, driver_on_the_way: Truck, driver_arrived: Truck, order_delivered: PackageCheck, order_completed: PackageCheck, payment_success: WalletCards, payment_failed: CircleAlert, flash_sale: Sparkles, voucher: Tag, promo: Tag, reward_point: Gift, member_level: Star, review_reminder: Star, wishlist_discount: Tag, store_open: Store, store_closed: Store, maintenance: Wrench, account: ShieldCheck, system: Bell };

export default function NotificationIcon({ type = "system", read = false, size = 18 }) {
  const Icon = icons[type] || Bell;
  return <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${read ? "bg-gray-100 text-gray-500" : "bg-primary text-white shadow-md shadow-primary/20"}`}><Icon size={size} /></span>;
}

export const defaultNotificationPreferences = { device:true, orders:true, payments:true, promos:true, account:true };
const keyFor=(userId)=>`dimsum-notification-preferences:${userId||"guest"}`;
export function getNotificationPreferences(userId){try{return {...defaultNotificationPreferences,...JSON.parse(localStorage.getItem(keyFor(userId))||"{}")};}catch{return {...defaultNotificationPreferences};}}
export function saveNotificationPreferences(userId,preferences){const value={...defaultNotificationPreferences,...preferences};localStorage.setItem(keyFor(userId),JSON.stringify(value));return value;}
export function notificationCategory(type="system"){if(["payment_success","payment_failed"].includes(type))return "payments";if(["promo","voucher","flash_sale","wishlist_discount","reward_point"].includes(type))return "promos";if(["account","system","maintenance"].includes(type))return "account";return "orders";}

import { useCallback, useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { supabase } from "../supabase/client.js";
import * as service from "../services/notificationService.js";
import NotificationDetailHeader from "../sections/notification/NotificationDetailHeader.jsx";
import NotificationIcon from "../components/notification/NotificationIcon.jsx";
import NotificationTime from "../components/notification/NotificationTime.jsx";
import NotificationTracking from "../sections/notification/NotificationTracking.jsx";
import NotificationInfo from "../sections/notification/NotificationInfo.jsx";
import NotificationFooter from "../sections/notification/NotificationFooter.jsx";
import LoginSecurityDetail from "../sections/notification/LoginSecurityDetail.jsx";

const trackingTypes = new Set(["driver_assigned", "driver_on_the_way", "driver_arrived", "order_delivered"]);
const statusCopy = {
  pending: { eyebrow: "Pesanan berhasil diterima", title: "Menunggu Konfirmasi", message: "Pesananmu sudah masuk dan akan segera diperiksa oleh tim Dimsum Lumer." },
  processing: { eyebrow: "Pesanan sedang diproses", title: "Sedang Kami Siapkan", message: "Tim kami sedang menyiapkan pesananmu dengan teliti agar segera dapat dikirim." },
  shipping: { eyebrow: "Pesanan dalam perjalanan", title: "Pesanan Sedang Diantar", message: "Pesananmu sudah berangkat menuju alamat tujuan. Pantau perjalanannya secara langsung." },
  completed: { eyebrow: "Pesanan telah diterima", title: "Pesanan Selesai", message: "Pesananmu telah selesai. Terima kasih sudah mempercayakan pesananmu kepada Dimsum Lumer." },
  cancelled: { eyebrow: "Informasi pesanan", title: "Pesanan Dibatalkan", message: "Pesanan ini telah dibatalkan. Lihat rincian di bawah untuk informasi selengkapnya." },
};

export default function NotificationDetail() {
  const { notificationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setError("");
      const item = await service.getNotification(notificationId, user.id);
      setNotification(item);
      if (item) {
        if (!item.is_read) await service.markAsRead(item.id, user.id);
        setOrder(await service.getOrderForNotification(item.order_id, user.id));
      }
    } catch (reason) {
      setError(reason?.message || "Detail notifikasi gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [notificationId, user]);

  useEffect(() => {
    load();
    if (!user) return undefined;
    const channel = supabase
      .channel(`notification-detail-${notificationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `id=eq.${notificationId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, notificationId, user]);

  const remove = async () => {
    if (!notification || !window.confirm("Hapus notifikasi ini?")) return;
    await service.deleteNotification(notification.id, user.id);
    navigate("/notifikasi", { replace: true });
  };

  if (loading) return <div className="grid min-h-dvh place-items-center bg-slate-50"><Loader2 className="animate-spin text-primary" /></div>;
  if (!notification) return <div className="grid min-h-dvh place-items-center bg-slate-50 px-6 text-center text-sm text-slate-500">{error || "Notifikasi tidak ditemukan."}</div>;

  const trackable = notification.order_id && trackingTypes.has(String(notification.type || "").toLowerCase());
  const status = String(order?.status || notification.metadata?.status || "").toLowerCase();
  const copy = statusCopy[status] || {
    eyebrow: order?.order_code ? `Pesanan ${order.order_code}` : "Informasi terbaru",
    title: notification.title || "Pembaruan Pesanan",
    message: notification.message || notification.body || "Ada pembaruan terbaru untuk pesananmu.",
  };
  const orderCode = order?.order_code || notification.metadata?.order_code;
  const isLoginSecurity = notification.metadata?.event === "new_device_login";
  const displayCopy = isLoginSecurity ? {
    eyebrow: "Keamanan Akun",
    title: "Aktivitas Login Baru",
    message: "Kami mendeteksi akses ke akun Anda dari perangkat yang belum pernah digunakan sebelumnya.",
  } : copy;

  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-slate-50 pb-8 text-slate-900">
      <NotificationDetailHeader onBack={() => navigate(-1)} onDelete={remove} />
      <main className="space-y-3 p-3 sm:p-5">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-lg shadow-slate-200">
          <BellRing className="absolute -right-4 -top-5 h-28 w-28 rotate-12 text-white/5" />
          <div className="relative flex items-start gap-3">
            <NotificationIcon type={notification.type} />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold uppercase tracking-[.18em] text-orange-300">{displayCopy.eyebrow}</span>
              <h1 className="mt-1 text-xl font-black leading-7">{displayCopy.title}</h1>
              <div className="mt-1"><NotificationTime value={notification.created_at} className="text-slate-300" /></div>
            </div>
          </div>
          <div className="relative mt-4 border-t border-white/10 pt-4">
            {orderCode && <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[9px] font-bold tracking-wide text-slate-300">{orderCode}</span>}
            <p className="mt-2 text-[11px] leading-6 text-slate-300">{displayCopy.message}</p>
          </div>
        </section>

        {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-3 text-[10px] text-red-600">{error}</p>}
        {trackable && <NotificationTracking metadata={notification.metadata} order={order} />}
        {isLoginSecurity && <LoginSecurityDetail metadata={notification.metadata} />}
        {notification.order_id && <NotificationInfo notification={notification} order={order} />}
        <NotificationFooter notification={notification} order={order} onTrack={() => order && navigate(`/lacak-pesanan/${order.id}`)} />
      </main>
    </div>
  );
}

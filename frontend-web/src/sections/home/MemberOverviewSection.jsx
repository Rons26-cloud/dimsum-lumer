import {
  ArrowRight,
  Clock3,
  Gift,
  MapPinned,
  ReceiptText,
  RefreshCw,
  Sparkles,
  Store,
  TicketPercent,
  Utensils,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { useProfile } from "../../hooks/useProfile.js";
import { usePoint } from "../../hooks/usePoint.js";
import { useStoreStatus } from "../../hooks/useStoreStatus.js";
import { reorderOrder } from "../../services/orderService.js";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import apkDownloadMascot from "../../assets/downloads/apk-download-mascot.png";

const statusLabel = {
  pending: "Menunggu konfirmasi",
  confirmed: "Pesanan dikonfirmasi",
  processing: "Sedang disiapkan",
  ready: "Siap dikirim",
  shipping: "Dalam perjalanan",
  completed: "Pesanan selesai",
  cancelled: "Pesanan dibatalkan",
};
const APK_DOWNLOAD_URL =
  "https://drive.usercontent.google.com/download?id=1_mT7orP1VKZN_2ugkIqZ9YfelG1dO9zh&export=download&confirm=t";

export default function MemberOverviewSection() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { point, orders } = usePoint(profile?.point);
  const { isOpen } = useStoreStatus();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showDownloadQr, setShowDownloadQr] = useState(false);
  const [downloadQr, setDownloadQr] = useState("");
  const name =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Pelanggan";
  const firstName = String(name).trim().split(/\s+/)[0];
  const order = orders.latestOrder;
  const active = order && !["completed", "cancelled"].includes(order.status);
  useEffect(() => {
    QRCode.toDataURL(APK_DOWNLOAD_URL, {
      width: 360,
      margin: 2,
      color: { dark: "#111827", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setDownloadQr);
  }, []);
  const reorder = async () => {
    if (!order || busy) return;
    setBusy(true);
    try {
      await reorderOrder(order.id);
      navigate("/keranjang");
    } catch {
      navigate("/orders");
    } finally {
      setBusy(false);
    }
  };
  const actions = [
    [
      Utensils,
      "Pesan Lagi",
      order ? reorder : () => navigate("/produk"),
      "bg-orange-50 text-orange-600",
    ],
    [
      TicketPercent,
      "Promo",
      () => navigate("/promo"),
      "bg-rose-50 text-rose-600",
    ],
    [
      MapPinned,
      "Lacak",
      () => navigate(active ? `/lacak-pesanan/${order.id}` : "/orders"),
      "bg-blue-50 text-blue-600",
    ],
    [
      Gift,
      "Reward",
      () => navigate(user ? "/profil/reward" : "/login"),
      "bg-violet-50 text-violet-600",
    ],
  ];
  return (
    <section className="mt-4 space-y-3 px-3 xs:px-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-primary">
            Selamat datang
          </p>
          <h1 className="mt-0.5 text-xl font-black text-gray-950">
            {user ? `Halo, ${firstName}` : "Halo, Foodies"}
          </h1>
          <p className="mt-1 text-[10px] font-medium text-gray-500">
            Mau menikmati dimsum apa hari ini?
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowDownloadQr(true)}
            aria-label="Download aplikasi Dimsum Lumer"
            title="Download APK"
            className="group block min-w-[10rem] rounded-xl transition active:scale-95"
          >
            <img
              src={apkDownloadMascot}
              alt="Logo Dimsum Lumer memeluk tulisan Download APK"
              className="h-20 w-auto max-w-[11rem] object-contain drop-shadow-md transition group-hover:scale-[1.03]"
            />
          </button>
          <span
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-extrabold shadow-sm ${isOpen ? "border-emerald-200 bg-emerald-500 text-white" : "border-red-700 bg-gray-950 text-red-300"}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isOpen ? "animate-pulse bg-white" : "bg-red-500"}`}
            />
            <Store size={12} />
            {isOpen ? "Toko buka" : "Toko tutup"}
          </span>
        </div>
      </div>
      {showDownloadQr && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-gray-950/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowDownloadQr(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-apk-title"
            className="relative w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowDownloadQr(false)}
              aria-label="Tutup popup download"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
            >
              <X size={20} />
            </button>
            <img
              src={apkDownloadMascot}
              alt="Logo Dimsum Lumer memeluk tulisan Download APK"
              className="mx-auto h-24 w-auto object-contain drop-shadow-md"
            />
            <h2 id="download-apk-title" className="mt-2 text-xl font-black text-gray-950">
              Download Aplikasi
            </h2>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Scan QR code berikut menggunakan kamera HP untuk mengunduh APK.
            </p>
            <div className="mx-auto mt-4 w-fit rounded-3xl border-4 border-orange-100 bg-white p-3 shadow-sm">
              {downloadQr ? (
                <img src={downloadQr} alt="QR code download APK Dimsum Lumer" className="h-56 w-56" />
              ) : (
                <div className="grid h-56 w-56 place-items-center text-xs font-bold text-gray-400">
                  Menyiapkan QR code...
                </div>
              )}
            </div>
            <p className="mt-4 text-[11px] font-semibold text-gray-500">
              Tersedia untuk perangkat Android.
            </p>
          </div>
        </div>
      )}
      {user && (
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/profil/poin"
            className="rounded-2xl bg-slate-950 p-4 text-white"
          >
            <p className="text-[9px] font-semibold text-white/55">
              Poin tersedia
            </p>
            <strong className="mt-1 block text-lg font-black text-orange-300">
              {Number(point || 0).toLocaleString("id-ID")} poin
            </strong>
          </Link>
          <Link
            to="/promo"
            className="rounded-2xl border border-orange-100 bg-orange-50 p-4"
          >
            <p className="text-[9px] font-semibold text-orange-700/60">
              Penawaran member
            </p>
            <strong className="mt-1 flex items-center gap-1 text-sm font-black text-orange-950">
              <Sparkles size={14} />
              Lihat promo
            </strong>
          </Link>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
        {actions.map(([Icon, label, action, tone]) => (
          <button
            key={label}
            onClick={action}
            disabled={busy && label === "Pesan Lagi"}
            className="flex min-w-0 flex-col items-center gap-2 rounded-2xl py-2 text-[9px] font-bold text-gray-700 disabled:opacity-50"
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}
            >
              {busy && label === "Pesan Lagi" ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <Icon size={18} />
              )}
            </span>
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
      {order && (
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white">
              <ReceiptText size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                    {active ? "Pesanan Aktif" : "Pesanan Terakhir"}
                  </p>
                  <h2 className="mt-0.5 truncate text-xs font-black text-gray-950">
                    {order.order_code || "Pesanan Anda"}
                  </h2>
                </div>
                <Clock3 size={16} className="text-blue-500" />
              </div>
              <p className="mt-2 text-[10px] font-semibold text-gray-600">
                {statusLabel[order.status] || "Status pesanan diperbarui"}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
                <span
                  className="block h-full rounded-full bg-blue-600"
                  style={{
                    width: active
                      ? order.status === "shipping"
                        ? "85%"
                        : order.status === "processing"
                          ? "55%"
                          : "28%"
                      : "100%",
                  }}
                />
              </div>
              <Link
                to={active ? `/lacak-pesanan/${order.id}` : "/orders"}
                className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700"
              >
                {active ? "Lacak pesanan" : "Lihat detail"}
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

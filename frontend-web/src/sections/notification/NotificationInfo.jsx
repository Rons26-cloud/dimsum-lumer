import {
  Check,
  CheckCircle2,
  CalendarDays,
  Clock3,
  CreditCard,
  MapPin,
  PackageCheck,
  ReceiptText,
  Truck,
  XCircle,
} from "lucide-react";
import MapsIcon from "../../components/maps/MapsIcon.jsx";
import qrisLogo from "../../assets/payment/qris-logo.svg";
import bankTransferLogo from "../../assets/payment/bank-transfer-logo.svg";

const STATUS = {
  pending: { label: "Menunggu Konfirmasi", description: "Pesanan sudah diterima dan sedang menunggu pemeriksaan.", Icon: Clock3, tone: "amber" },
  processing: { label: "Sedang Disiapkan", description: "Pesanan sedang diproses dan disiapkan oleh tim kami.", Icon: PackageCheck, tone: "blue" },
  shipping: { label: "Dalam Pengiriman", description: "Pesanan sedang dalam perjalanan menuju alamat tujuan.", Icon: Truck, tone: "violet" },
  completed: { label: "Pesanan Selesai", description: "Pesanan sudah diterima. Terima kasih sudah memesan.", Icon: CheckCircle2, tone: "emerald" },
  cancelled: { label: "Pesanan Dibatalkan", description: "Pesanan ini telah dibatalkan.", Icon: XCircle, tone: "red" },
};

const PAYMENT = {
  unpaid: "Belum dibayar",
  waiting_verification: "Menunggu verifikasi",
  paid: "Sudah dibayar",
  verified: "Pembayaran terverifikasi",
  failed: "Pembayaran gagal",
  refunded: "Dana dikembalikan",
};

const tones = {
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  violet: "border-violet-100 bg-violet-50 text-violet-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  red: "border-red-100 bg-red-50 text-red-700",
};

const steps = [
  ["pending", "Diterima"],
  ["processing", "Disiapkan"],
  ["shipping", "Dikirim"],
  ["completed", "Selesai"],
];

const money = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const dateTime = (value) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)) : "-";

function DetailRow({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500"><Icon size={14} /></span>
      <div className="min-w-0 flex-1">
        <span className="block text-[9px] font-semibold uppercase tracking-[.12em] text-slate-400">{label}</span>
        <strong className={`mt-1 block break-words text-[11px] leading-5 ${accent ? "text-primary" : "text-slate-700"}`}>{value || "-"}</strong>
      </div>
    </div>
  );
}

function PaymentLogo({ method }) {
  const key = String(method || "").toLowerCase();
  if (key.includes("qris")) return <img src={qrisLogo} alt="QRIS" className="h-5 w-10 object-contain" />;
  if (key.includes("transfer") || key.includes("bank") || ["bca", "bri", "bni", "mandiri"].some((name) => key.includes(name))) {
    return <img src={bankTransferLogo} alt="Transfer bank" className="h-5 w-10 object-contain" />;
  }
  if (key === "cod") return <span className="grid h-7 w-10 place-items-center rounded-lg bg-emerald-100 text-[8px] font-black text-emerald-700">COD</span>;
  return <CreditCard size={16} className="text-violet-600" />;
}

function DeliveryBrand({ method }) {
  const key = String(method || "").toLowerCase();
  if (key.includes("gojek")) return <span className="rounded-lg bg-emerald-600 px-2 py-1 text-[8px] font-black tracking-wide text-white">GOJEK</span>;
  if (key.includes("grab")) return <span className="rounded-lg bg-green-50 px-2 py-1 text-[8px] font-black tracking-wide text-green-700">Grab</span>;
  return <Truck size={17} className="text-blue-600" />;
}

function DestinationMap({ order, address }) {
  const lat = Number(order?.customer_lat ?? order?.delivery_latitude);
  const lng = Number(order?.customer_lng ?? order?.delivery_longitude);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const query = hasCoordinates ? `${lat},${lng}` : address;
  if (!query) return null;
  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50"><MapsIcon size={21} alt="Google Maps" /></span>
          <div><span className="block text-[9px] font-semibold uppercase tracking-[.12em] text-slate-400">Alamat Tujuan</span><strong className="mt-0.5 block text-[11px] text-slate-800">Lokasi Pengantaran</strong></div>
        </div>
        <a href={externalUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-50 px-3 py-2 text-[9px] font-bold text-blue-700">Buka Maps</a>
      </div>
      <iframe title="Peta alamat tujuan" src={embedUrl} className="h-48 w-full border-0 bg-slate-100" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      <div className="flex items-start gap-3 border-t border-slate-100 p-4">
        <MapPin size={17} className="mt-0.5 shrink-0 text-primary" />
        <div><span className="text-[9px] font-semibold uppercase tracking-[.12em] text-slate-400">Keterangan alamat</span><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-700">{address || `${lat}, ${lng}`}</p></div>
      </div>
    </section>
  );
}

export default function NotificationInfo({ notification, order }) {
  const meta = notification.metadata || {};
  const statusKey = String(order?.status || meta.status || "pending").toLowerCase();
  const state = STATUS[statusKey] || { label: order?.status || "Status diperbarui", description: notification.message, Icon: PackageCheck, tone: "blue" };
  const StateIcon = state.Icon;
  const activeIndex = steps.findIndex(([key]) => key === statusKey);
  const total = order?.total_amount ?? order?.total_price ?? order?.total;
  const address = order?.shipping_address || order?.delivery_address || order?.delivery_notes;

  return (
    <div className="space-y-3">
      <section className={`rounded-3xl border p-4 ${tones[state.tone] || tones.blue}`}>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 shadow-sm"><StateIcon size={21} /></span>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[.16em] opacity-70">Status saat ini</span>
            <h2 className="mt-1 text-sm font-black">{state.label}</h2>
            <p className="mt-1 text-[10px] leading-5 opacity-80">{statusKey === "cancelled" && order?.cancellation_reason ? order.cancellation_reason : state.description}</p>
          </div>
        </div>
      </section>

      {statusKey !== "cancelled" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-900">Progres Pesanan</h2>
            <span className="text-[9px] font-semibold text-slate-400">Diperbarui {dateTime(order?.updated_at || notification.created_at)}</span>
          </div>
          <div className="grid grid-cols-4">
            {steps.map(([key, label], index) => {
              const done = activeIndex >= index;
              return (
                <div key={key} className="relative text-center">
                  {index > 0 && <span className={`absolute right-1/2 top-3 h-0.5 w-full ${done ? "bg-primary" : "bg-slate-200"}`} />}
                  <span className={`relative mx-auto grid h-6 w-6 place-items-center rounded-full border-2 ${done ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-300"}`}>{done ? <Check size={12} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span>
                  <span className={`mt-2 block text-[8px] font-bold ${done ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[8px] font-bold uppercase tracking-[.18em] text-slate-400">Nomor pesanan</span>
              <h2 className="mt-1.5 truncate font-mono text-sm font-black tracking-wide text-white">{order?.order_code ? `#${order.order_code}` : (order?.id || notification.order_id)}</h2>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-orange-300"><ReceiptText size={19} /></span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2">
          <div className="flex items-start gap-3 bg-white p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><CalendarDays size={16} /></span>
            <div className="min-w-0"><span className="text-[8px] font-semibold uppercase tracking-[.12em] text-slate-400">Waktu pemesanan</span><strong className="mt-1 block text-[10px] leading-5 text-slate-700">{dateTime(order?.created_at)}</strong></div>
          </div>
          <div className="flex items-start gap-3 bg-white p-4">
            <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 px-1.5"><DeliveryBrand method={order?.shipping_method} /></span>
            <div className="min-w-0"><span className="text-[8px] font-semibold uppercase tracking-[.12em] text-slate-400">Metode pengiriman</span><strong className="mt-1 block text-[10px] leading-5 text-slate-700">{order?.shipping_method ? String(order.shipping_method).toUpperCase() : "Belum ditentukan"}</strong></div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white p-1.5 shadow-sm"><PaymentLogo method={order?.payment_method} /></span>
              <div className="min-w-0"><span className="text-[8px] font-semibold uppercase tracking-[.12em] text-slate-400">Metode pembayaran</span><strong className="mt-1 block text-[10px] text-slate-800">{String(order?.payment_method || "Belum dipilih").replaceAll("_", " ").replace(/^transfer$/i, "Transfer Bank")}</strong></div>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1.5 text-[8px] font-extrabold ${["paid", "verified"].includes(order?.payment_status) ? "bg-emerald-50 text-emerald-700" : order?.payment_status === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{PAYMENT[order?.payment_status] || order?.payment_status || "Belum dibayar"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-slate-200 bg-slate-50 px-4 py-4">
          <div><span className="block text-[8px] font-semibold uppercase tracking-[.12em] text-slate-400">Total pembayaran</span><span className="mt-1 block text-[9px] text-slate-500">Termasuk biaya pengiriman</span></div>
          <strong className="text-lg font-black tracking-tight text-primary">{money(total)}</strong>
        </div>
      </section>
      <DestinationMap order={order} address={address} />
    </div>
  );
}

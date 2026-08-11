import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  Loader2,
  QrCode,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getFreshLocation } from "../hooks/useLiveGeolocation.js";
import { resolveProductImage } from "../features/products/productAssets.js";
import MapsIcon from "../components/maps/MapsIcon.jsx";
import qrisImage from "../assets/payment/qris-placeholder.jpg";
import { BrandLogo } from "../components/checkout/BrandLogo.jsx";

const shippingOptions = [
  { id: "pickup", label: "Ambil Sendiri", brand: "cod" },
  { id: "gofood", label: "GoFood", brand: "gofood" },
  { id: "gojek", label: "Gojek", brand: "gojek" },
];
const paymentOptions = [
  {
    id: "cod",
    label: "Tunai",
    Icon: Banknote,
    detail:
      "Bayar langsung saat pesanan diterima. Cocok untuk ambil sendiri atau pengantaran COD.",
  },
  {
    id: "transfer",
    label: "Transfer",
    Icon: WalletCards,
    detail:
      "Transfer ke rekening penjual. Detail rekening akan ikut ditampilkan pada konfirmasi.",
  },
  {
    id: "qris",
    label: "QRIS",
    Icon: QrCode,
    detail: "Pindai QRIS resmi Dimsum Lumer, lalu siapkan bukti pembayaran.",
  },
];

export default function GuestOrder() {
  const navigate = useNavigate();
  const route = useLocation();
  const [params] = useSearchParams();
  const product = route.state?.product || null;
  const initialVariant = route.state?.variant || {
    label: params.get("variant") || "Goreng (Siap Makan)",
    price: Number(params.get("price") || product?.price || 0),
  };
  const initialQty = Number(route.state?.qty || params.get("qty") || 1);
  const [form, setForm] = useState({
    shipping: "pickup",
    name: "",
    phone: "",
    address: "",
    payment: "cod",
    notes: "",
  });
  const [coords, setCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("loading");
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const itemUnit =
    initialVariant.unit ||
    (String(initialVariant.label).toLowerCase().includes("frozen")
      ? "20 Pcs"
      : "Box");
  const total = Number(initialVariant.price || 0) * initialQty;
  const selectedPayment = useMemo(
    () => paymentOptions.find((item) => item.id === form.payment),
    [form.payment],
  );
  const image = product ? resolveProductImage(product) : "";
  const gpsReady =
    gpsStatus === "success" &&
    coords &&
    Date.now() - Number(coords.timestamp || 0) < 120000 &&
    Number(coords.accuracy || Infinity) <= 1000;

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const locate = async () => {
    setGpsStatus("loading");
    setError("");
    try {
      const location = await getFreshLocation();
      if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng))
        throw new Error("Koordinat GPS tidak valid.");
      if (Number(location.accuracy || Infinity) > 1000)
        throw new Error(
          "Akurasi GPS terlalu rendah. Aktifkan mode lokasi akurat lalu coba kembali.",
        );
      setCoords(location);
      setGpsStatus("success");
      if (!form.address.trim()) {
        setResolvingAddress(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=id&lat=${location.lat}&lon=${location.lng}`,
          );
          if (response.ok) {
            const result = await response.json();
            if (result.display_name) update("address", result.display_name);
          }
        } catch {
        } finally {
          setResolvingAddress(false);
        }
      }
    } catch (reason) {
      setGpsStatus("error");
      setError(reason.message);
    }
  };
  useEffect(() => {
    locate();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!product) {
      setError("Data produk tidak ditemukan. Silakan pilih produk kembali.");
      return;
    }
    if (!form.name.trim()) {
      setError("Nama pemesan wajib diisi.");
      return;
    }
    if (!/^\+?[0-9][0-9\s-]{7,}$/.test(form.phone.trim())) {
      setError("Nomor WhatsApp wajib diisi dengan nomor yang valid.");
      return;
    }
    if (form.shipping !== "pickup" && !form.address.trim()) {
      setError("Alamat pengantaran wajib diisi untuk GoFood atau Gojek.");
      return;
    }
    if (!coords || gpsStatus !== "success") {
      setError("Aktifkan lokasi perangkat sebelum mengirim pesanan.");
      await locate();
      return;
    }
    const admin = (import.meta.env.VITE_ADMIN_WA_NUMBER || "").replace(
      /\D/g,
      "",
    );
    if (!admin) {
      setError("Nomor WhatsApp admin belum dikonfigurasi.");
      return;
    }
    setSending(true);
    let verifiedCoords;
    try {
      verifiedCoords = await getFreshLocation();
      if (Number(verifiedCoords.accuracy || Infinity) > 1000)
        throw new Error(
          "Akurasi GPS terlalu rendah. Pindah ke area terbuka lalu coba lagi.",
        );
      setCoords(verifiedCoords);
      setGpsStatus("success");
    } catch (reason) {
      setGpsStatus("error");
      setError(reason.message || "Lokasi perangkat gagal diverifikasi.");
      setSending(false);
      return;
    }
    const shipping = shippingOptions.find(
      (item) => item.id === form.shipping,
    )?.label;
    const mapUrl = `https://www.google.com/maps?q=${verifiedCoords.lat},${verifiedCoords.lng}`;
    const paymentInfo =
      form.payment === "transfer"
        ? `${import.meta.env.VITE_SELLER_BANK || "BCA"} ${import.meta.env.VITE_SELLER_ACCOUNT || "-"} a.n. ${import.meta.env.VITE_SELLER_NAME || "DIMSUM LUMER"}`
        : selectedPayment.label;
    const message = `Halo Admin Dimsum Lumer,\nSaya ingin melakukan pemesanan.\n\nData Pemesan:\nNama: ${form.name.trim()}\nNo. HP: ${form.phone.trim()}\nAlamat: ${form.address.trim() || "Ambil sendiri di toko"}\nLokasi terverifikasi: ${mapUrl}\nKoordinat: ${verifiedCoords.lat.toFixed(6)}, ${verifiedCoords.lng.toFixed(6)}\nAkurasi GPS: ${Math.round(verifiedCoords.accuracy)} meter\nWaktu verifikasi: ${new Date(verifiedCoords.timestamp || Date.now()).toLocaleString("id-ID")}\n\nDetail Pesanan:\nMenu: ${product.name}\nJenis: ${initialVariant.label}\nJumlah: ${initialQty} ${itemUnit}\nPengiriman: ${shipping}\n\nHarga: Rp${Number(initialVariant.price).toLocaleString("id-ID")} / ${itemUnit}\nTotal: Rp${total.toLocaleString("id-ID")}\n\nPembayaran: ${paymentInfo}\n\nCatatan: ${form.notes.trim() || "-"}\nMohon pesanan ini dapat diproses.\nTerima kasih.`;
    window.location.href = `https://wa.me/${admin}?text=${encodeURIComponent(message)}`;
    setSending(false);
  };

  if (!product)
    return (
      <div className="mx-auto max-w-md p-4">
        <button onClick={() => navigate(-1)} className="bg-transparent">
          <ArrowLeft size={20} />
        </button>
        <p className="mt-8 text-center text-xs">Produk tidak ditemukan.</p>
      </div>
    );
  return (
    <div className="mx-auto min-h-dvh max-w-xl bg-white pb-6">
      <header className="flex h-12 items-center px-3">
        <button
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 place-items-center bg-transparent"
          aria-label="Kembali"
        >
          <ArrowLeft size={19} />
        </button>
        <h1 className="flex-1 text-center text-xs font-extrabold">
          Data Pemesanan
        </h1>
        <span className="w-9" />
      </header>
      <form onSubmit={submit} className="space-y-4 px-3">
        <section className="flex gap-3 rounded-2xl border border-gray-100 p-3">
          {image && (
            <img
              src={image}
              alt={product.name}
              className="h-16 w-16 rounded-xl object-cover"
            />
          )}
          <div className="min-w-0 text-[10px]">
            <span className="text-gray-500">Menu</span>
            <strong className="block truncate text-xs">{product.name}</strong>
            <span className="mt-1 block">Jenis: {initialVariant.label}</span>
            <span>
              Jumlah: {initialQty} {itemUnit}
            </span>
            <strong className="mt-1 block">
              Total: Rp{total.toLocaleString("id-ID")}
            </strong>
          </div>
        </section>
        <fieldset>
          <legend className="mb-2 text-[10px] font-bold">Pengiriman *</legend>
          <div className="grid grid-cols-3 gap-2">
            {shippingOptions.map(({ id, label, brand }) => (
              <button
                type="button"
                key={id}
                onClick={() => update("shipping", id)}
                className={`flex h-16 flex-col items-center justify-center gap-1 rounded-xl border text-[9px] ${form.shipping === id ? "border-primary bg-primary-50" : "border-gray-100"}`}
              >
                <BrandLogo brand={brand} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block text-[10px] font-bold">
          Nama Pemesan *
          <input
            required
            placeholder="Nama lengkap Anda"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-gray-200 px-3 text-xs outline-none focus:border-primary"
          />
        </label>
        <label className="block text-[10px] font-bold">
          Nomor WhatsApp *
          <input
            required
            type="tel"
            inputMode="tel"
            placeholder="08xxxxxxxxxx"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-gray-200 px-3 text-xs outline-none focus:border-primary"
          />
        </label>
        <label className="block text-[10px] font-bold">
          Alamat Pengantaran {form.shipping !== "pickup" && "*"}
          <textarea
            required={form.shipping !== "pickup"}
            placeholder="Jl., No., Kota (opsional jika ambil sendiri)"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            rows="3"
            className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-xs outline-none focus:border-primary"
          />
        </label>
        <section
          className={`overflow-hidden rounded-2xl border ${gpsReady ? "border-emerald-200" : "border-red-200"}`}
        >
          <div className="bg-white p-3">
            <div className="flex items-center gap-2 text-[10px]">
              <MapsIcon size={20} />
              <span className="min-w-0 flex-1">
                <strong className="block">Lokasi pengiriman wajib</strong>
                <span className="text-[9px] text-gray-500">
                  {gpsStatus === "loading" || resolvingAddress
                    ? "Mengambil dan memverifikasi lokasi..."
                    : gpsReady
                      ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)} · akurasi ${Math.round(coords.accuracy)} m`
                      : "GPS belum terverifikasi. Pesanan tidak dapat dikirim."}
                </span>
              </span>
              <button
                type="button"
                onClick={locate}
                disabled={gpsStatus === "loading" || resolvingAddress}
                className="grid h-8 w-8 place-items-center rounded-full border border-gray-100 bg-white"
                aria-label="Perbarui lokasi"
              >
                <RefreshCw
                  size={14}
                  className={
                    gpsStatus === "loading" || resolvingAddress
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>
            </div>
          </div>
          {gpsReady && (
            <iframe
              title="Preview lokasi pemesan"
              src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=17&output=embed`}
              className="h-44 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </section>
        <fieldset>
          <legend className="mb-2 text-[10px] font-bold">Pembayaran *</legend>
          <div className="grid grid-cols-3 gap-2">
            {paymentOptions.map(({ id, label, Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => update("payment", id)}
                className={`flex h-14 flex-col items-center justify-center gap-1 rounded-xl border text-[9px] ${form.payment === id ? "border-primary bg-primary-50 text-primary" : "border-gray-100 text-dark"}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2 rounded-xl bg-gray-50 p-3">
            <span className="text-[8px]">Metode pembayaran yang dipilih</span>
            <strong className="mt-1 block text-[10px]">
              {selectedPayment.label}
            </strong>
            <p className="mt-1 text-[9px] leading-4">
              {selectedPayment.detail}
            </p>
            {form.payment === "transfer" && (
              <p className="mt-2 rounded-lg bg-white p-2 text-[9px] font-semibold">
                {import.meta.env.VITE_SELLER_BANK || "BCA"} ·{" "}
                {import.meta.env.VITE_SELLER_ACCOUNT || "-"} ·{" "}
                {import.meta.env.VITE_SELLER_NAME || "DIMSUM LUMER"}
              </p>
            )}
            {form.payment === "qris" && (
              <img
                src={import.meta.env.VITE_SELLER_QRIS_IMAGE || qrisImage}
                alt="QRIS Admin Dimsum Lumer"
                className="mx-auto mt-3 w-full max-w-[220px] rounded-xl"
              />
            )}
          </div>
        </fieldset>
        <label className="block text-[10px] font-bold">
          Catatan (opsional)
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Contoh: extra sambal, tanpa daun bawang, dll"
            rows="3"
            className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-xs outline-none focus:border-primary"
          />
        </label>
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-[9px] text-red-600">
            {error}
          </p>
        )}
        <button
          disabled={sending || !gpsReady || resolvingAddress}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-whatsapp text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {sending || gpsStatus === "loading" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : null}
          {gpsReady
            ? "Kirim Pesanan via WhatsApp"
            : "Aktifkan GPS untuk Melanjutkan"}
        </button>
        <p className="text-center text-[9px] leading-4 text-gray-500">
          GPS diverifikasi ulang saat pesanan dikirim. Pesan WhatsApp akan
          menyertakan alamat, koordinat, akurasi, waktu verifikasi, dan tautan
          Google Maps.
        </p>
      </form>
    </div>
  );
}

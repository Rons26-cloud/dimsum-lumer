import { useEffect, useState } from "react";
import { Signal, Wifi, BatteryFull } from "lucide-react";
import logo from "../../assets/logo/logo.png";

// Helper function untuk mengambil jam saat ini
function getTime() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Bingkai HP ini HANYA tampil kalau website dibuka di layar lebar (desktop/laptop),
 * supaya pengunjung desktop tetap bisa melihat & mencoba tampilan mobile aslinya.
 * Trik: konten di-load ulang di dalam <iframe> dengan lebar tetap, sehingga
 * breakpoint mobile (Tailwind) benar-benar aktif — bukan sekadar di-scale dengan CSS.
 */
export default function DevicePreviewFrame({ onExit }) {
  const [time, setTime] = useState(getTime());

  useEffect(() => {
    const interval = setInterval(() => setTime(getTime()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 flex flex-col items-center justify-center p-6 sm:p-10 select-none">
      {/* Header Info Pratinjau */}
      <div className="flex items-center gap-2 mb-6">
        <img src={logo} alt="Dimsum Lumer" className="w-8 h-8 rounded-full object-cover shadow-xs" />
        <p className="text-sm font-semibold text-gray-500">
          Pratinjau Mobile — <span className="text-gray-800 font-bold">Dimsum Lumer</span>
        </p>
      </div>

      {/* Bezel / Bingkai HP */}
      <div className="relative">
        {/* Tombol samping dekoratif (Volume & Power) */}
        <div className="absolute -left-[3px] top-24 w-[3px] h-8 bg-gray-800 rounded-l" />
        <div className="absolute -left-[3px] top-36 w-[3px] h-12 bg-gray-800 rounded-l" />
        <div className="absolute -left-[3px] top-52 w-[3px] h-12 bg-gray-800 rounded-l" />
        <div className="absolute -right-[3px] top-32 w-[3px] h-16 bg-gray-800 rounded-r" />

        {/* Bodi HP */}
        <div className="w-[390px] h-[812px] bg-black rounded-[3rem] p-[14px] shadow-2xl">
          <div className="relative w-full h-full bg-white rounded-[2.25rem] overflow-hidden flex flex-col">
            {/* Notch / Poni Layar */}
            <div className="absolute top-0 inset-x-0 flex justify-center z-20 pointer-events-none">
              <div className="w-32 h-6 bg-black rounded-b-2xl" />
            </div>

            {/* Status bar palsu — meniru tampilan status bar HP */}
            <div className="h-11 shrink-0 flex items-end justify-between px-7 pb-1.5 text-[13px] font-semibold text-gray-900 bg-white z-10">
              <span>{time}</span>
              <div className="flex items-center gap-1.5 text-gray-900">
                <Signal size={14} strokeWidth={2.4} />
                <Wifi size={14} strokeWidth={2.4} />
                <BatteryFull size={18} strokeWidth={2} />
              </div>
            </div>

            {/* Konten website — dimuat ulang di dalam iframe supaya breakpoint mobile aktif */}
            <iframe
              src={window.location.href}
              title="Dimsum Lumer — Preview Mobile"
              className="flex-1 w-full border-0 bg-white"
            />

            {/* Home indicator garis bawah */}
            <div className="absolute bottom-1.5 inset-x-0 flex justify-center z-20 pointer-events-none">
              <div className="w-32 h-1 bg-black/80 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Catatan panduan di bawah bingkai */}
      <p className="text-xs text-gray-400 mt-6 max-w-xs text-center">
        Perbesar jendela browser atau buka langsung di perangkat seluler untuk pengalaman penuh sebagai aplikasi (PWA).
      </p>

      {/* Tombol Keluar / Lihat Versi Desktop */}
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="mt-3 text-xs font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Lihat versi desktop biasa
        </button>
      )}
    </div>
  );
}
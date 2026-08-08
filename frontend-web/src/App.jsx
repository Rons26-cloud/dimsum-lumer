import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import AppRouter from "./router/AppRouter.jsx";
import MaintenanceGuard from "./components/maintenance/MaintenanceGuard.jsx";
import DevicePreviewFrame from "./components/layout/DevicePreviewFrame.jsx";
import AppErrorBoundary from "./components/maintenance/AppErrorBoundary.jsx";
import CartRealtimeSync from "./components/cart/CartRealtimeSync.jsx";

const DESKTOP_BREAKPOINT = 1024;
const OVERRIDE_KEY = "dimsumFrameMode"; // "frame" | "full" | null (null = otomatis)

function isEmbedded() {
  try {
    return window.self !== window.top;
  } catch {
    return false;
  }
}

function computeMode() {
  if (isEmbedded()) return "full"; // konten di dalam iframe bingkai — tampilkan apa adanya
  const override = sessionStorage.getItem(OVERRIDE_KEY);
  if (override === "frame" || override === "full") return override;
  return window.innerWidth >= DESKTOP_BREAKPOINT ? "frame" : "full";
}

export default function App() {
  const [mode, setMode] = useState(computeMode);
  const [isWide, setIsWide] = useState(
    typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT
  );

  useEffect(() => {
    const handleResize = () => {
      setMode(computeMode());
      setIsWide(window.innerWidth >= DESKTOP_BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const exitFrame = () => {
    sessionStorage.setItem(OVERRIDE_KEY, "full");
    setMode("full");
  };

  const enterFrame = () => {
    sessionStorage.setItem(OVERRIDE_KEY, "frame");
    setMode("frame");
  };

  const isCheckoutRoute = window.location.pathname.startsWith('/checkout');

  if (mode === "frame" && !isCheckoutRoute) {
    return <DevicePreviewFrame onExit={exitFrame} />;
  }

  return (
    <AppErrorBoundary>
    <MaintenanceGuard>
      <CartRealtimeSync />
      <AppRouter />
      {/* Tombol kembali ke bingkai HP — hanya berguna & tampil di layar lebar */}
      {isWide && !isEmbedded() && (
        <button
          onClick={enterFrame}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-dark text-white text-xs font-semibold pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:bg-black transition-colors"
        >
          <Smartphone size={15} /> Pratinjau Mode HP
        </button>
      )}
    </MaintenanceGuard>
    </AppErrorBoundary>
  );
}

import { useEffect, useRef, useState } from "react";
import { ArrowDown, Check, Loader2, RefreshCw } from "lucide-react";

const THRESHOLD = 76;
const MAX_PULL = 112;

export default function PullToRefresh({ children }) {
  const startY = useRef(null);
  const pulling = useRef(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const begin = (event) => {
      if (refreshing || window.scrollY > 0 || event.touches.length !== 1) return;
      startY.current = event.touches[0].clientY;
      pulling.current = true;
    };

    const move = (event) => {
      if (!pulling.current || startY.current === null) return;
      const delta = event.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setDistance(0);
        return;
      }
      if (window.scrollY > 0) {
        pulling.current = false;
        setDistance(0);
        return;
      }
      event.preventDefault();
      setDistance(Math.min(MAX_PULL, delta * 0.48));
    };

    const finish = () => {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;
      if (distance >= THRESHOLD) {
        setRefreshing(true);
        setDistance(58);
        window.setTimeout(() => window.location.reload(), 420);
      } else {
        setDistance(0);
      }
    };

    document.addEventListener("touchstart", begin, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", finish, { passive: true });
    document.addEventListener("touchcancel", finish, { passive: true });
    return () => {
      document.removeEventListener("touchstart", begin);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", finish);
      document.removeEventListener("touchcancel", finish);
    };
  }, [distance, refreshing]);

  const ready = distance >= THRESHOLD;
  return <div className="relative min-h-dvh">
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+.5rem)] z-[100] flex justify-center transition-opacity duration-200"
      style={{ opacity: distance > 8 || refreshing ? 1 : 0 }}
    >
      <div className="flex h-10 items-center gap-2 rounded-full border border-orange-100 bg-white/95 px-3.5 text-[10px] font-bold text-slate-600 shadow-lg shadow-orange-950/10 backdrop-blur">
        {refreshing ? <Loader2 size={15} className="animate-spin text-primary"/> : ready ? <Check size={15} className="text-emerald-500"/> : distance > 28 ? <ArrowDown size={15} className="text-primary"/> : <RefreshCw size={14} className="text-primary"/>}
        {refreshing ? "Memperbarui..." : ready ? "Lepas untuk memperbarui" : "Tarik untuk memperbarui"}
      </div>
    </div>
    <div
      className="min-h-dvh transition-transform duration-200 ease-out"
      style={{
        // Jangan pasang transform saat idle. Ancestor yang memiliki transform
        // mengubah acuan position:fixed dan membuat bottom navigation ikut scroll.
        transform: distance > 0 || refreshing ? `translateY(${refreshing ? 12 : Math.min(distance * 0.3, 28)}px)` : undefined,
        transitionDuration: pulling.current ? "0ms" : "200ms",
      }}
    >{children}</div>
  </div>;
}

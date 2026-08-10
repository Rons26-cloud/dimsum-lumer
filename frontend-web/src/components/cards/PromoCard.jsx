import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export default function PromoCard({ promo, onUsePromo }) {
  const [copied, setCopied] = useState(false);
  const discountLabel = promo?.discount_label || (promo?.discount_type === 'percentage'
    ? `DISKON ${Number(promo?.discount_value || 0).toLocaleString('id-ID')}%`
    : `DISKON Rp${Number(promo?.discount_value || 0).toLocaleString('id-ID')}`);

  const handleAction = () => {
    if (!promo?.code) return;
    navigator.clipboard.writeText(promo.code);
    setCopied(true);
    onUsePromo?.(promo);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[480px] mx-auto bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white relative overflow-hidden shadow-sm">
      {/* Header Badge & Label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Sparkles size={11} />
          <span>{promo?.badge || 'Paling Populer'}</span>
        </div>
        <span className="text-[10px] font-extrabold bg-white text-orange-600 px-2 py-0.5 rounded-md shadow-sm">
          {discountLabel}
        </span>
      </div>

      {/* Judul & Deskripsi Ringkas */}
      <div className="space-y-1 mb-3">
        <h3 className="text-sm font-extrabold tracking-tight line-clamp-1">
          {promo?.title || 'Diskon Spesial Akhir Pekan'}
        </h3>
        <p className="text-[11px] text-orange-50 line-clamp-2 leading-relaxed">
          {promo?.description || 'Nikmati akhir pekan bersama keluarga ditemani hangatnya dimsum lumer dengan potongan harga spesial.'}
        </p>
      </div>

      {/* Garis Pembatas Tipis */}
      <div className="border-t border-white/20 pt-3 flex items-center justify-between gap-2">
        {/* Kode Promo Box */}
        <div className="bg-black/20 border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
          <span className="text-[9px] text-orange-200 font-semibold uppercase">KODE:</span>
          <span className="font-mono font-bold text-xs tracking-wider text-white">
            {promo?.code || 'WEEKEND30'}
          </span>
        </div>

        {/* Tombol Aksi */}
        <button
          type="button"
          onClick={handleAction}
          className="bg-white hover:bg-orange-50 text-orange-600 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer touch-manipulation"
        >
          <span>{copied ? 'Tersalin!' : 'Gunakan'}</span>
          {!copied && <ArrowRight size={13} />}
        </button>
      </div>

      {/* Ornamen Latar Belakang */}
      <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">
        <span className="text-6xl">🥟</span>
      </div>
    </div>
  );
}

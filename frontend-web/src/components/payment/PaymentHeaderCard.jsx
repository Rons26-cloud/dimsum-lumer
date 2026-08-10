import { Check, Copy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const METHOD_STYLES = {
  bca: { label: 'BCA', background: 'linear-gradient(135deg,#004f9f 0%,#0877c9 55%,#00a9e0 100%)', accent: '#0877c9' },
  mandiri: { label: 'mandiri', background: 'linear-gradient(135deg,#003d79 0%,#00529b 68%,#e9a900 100%)', accent: '#00529b' },
  bri: { label: 'BRI', background: 'linear-gradient(135deg,#003f78 0%,#0068b5 58%,#00a6e2 100%)', accent: '#0068b5' },
  bni: { label: 'BNI', background: 'linear-gradient(135deg,#00574f 0%,#008579 65%,#ed8515 100%)', accent: '#008579' },
  gopay: { label: 'gopay', background: 'linear-gradient(135deg,#007bb8 0%,#00a9e0 58%,#13c4ee 100%)', accent: '#00a9e0' },
  dana: { label: 'DANA', background: 'linear-gradient(135deg,#075fbd 0%,#118eea 58%,#45b6ff 100%)', accent: '#118eea' },
  ovo: { label: 'OVO', background: 'linear-gradient(135deg,#291052 0%,#4c2391 58%,#7650bd 100%)', accent: '#4c2391' },
  shopeepay: { label: 'ShopeePay', background: 'linear-gradient(135deg,#bd2b12 0%,#ee4d2d 58%,#ff7257 100%)', accent: '#ee4d2d' },
  qris: { label: 'QRIS', background: 'linear-gradient(135deg,#8f1020 0%,#d7193f 58%,#ef476f 100%)', accent: '#d7193f' },
  transfer: { label: 'BANK', background: 'linear-gradient(135deg,#111827 0%,#263753 58%,#405777 100%)', accent: '#263753' },
};

const logoDataUri = (label, color) => {
  const safeLabel = String(label).replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="72" viewBox="0 0 180 72"><rect width="180" height="72" rx="14" fill="white"/><circle cx="28" cy="36" r="15" fill="${color}" opacity=".14"/><circle cx="28" cy="36" r="8" fill="${color}"/><text x="50" y="43" fill="${color}" font-family="Arial,sans-serif" font-size="22" font-weight="800">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export default function PaymentHeaderCard({ selectedMethod = 'transfer', orderCode = '-', accountNumber = '', recipientName = '' }) {
  const [copied, setCopied] = useState('');
  const methodKey = String(selectedMethod || 'transfer').toLowerCase().replace(/[^a-z]/g, '');
  const config = METHOD_STYLES[methodKey] || METHOD_STYLES.transfer;
  const logoSrc = useMemo(() => logoDataUri(config.label, config.accent), [config]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(''), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyAccount = async () => {
    try { await navigator.clipboard.writeText(String(accountNumber)); setCopied('account'); }
    catch { setCopied(''); }
  };

  return <section style={{ background: config.background, backgroundColor: config.accent }} className="relative isolate min-h-[250px] overflow-hidden rounded-2xl p-5 text-white shadow-xl shadow-slate-900/25 sm:min-h-[270px] sm:p-6">
    <div aria-hidden="true" className="absolute -right-12 -top-14 h-44 w-44 rounded-full border-[30px] border-white/10" />
    <div aria-hidden="true" className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
    <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,.12)_50%,transparent_65%)]" />

    <div className="relative z-10 flex h-full min-h-[210px] flex-col justify-between sm:min-h-[222px]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 pt-0.5">
          <p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/70 sm:text-[10px]">Metode Pembayaran</p>
          <strong className="mt-2 block truncate text-2xl font-black leading-none tracking-tight drop-shadow-sm sm:text-3xl">{config.label}</strong>
          <p className="mt-2 text-[9px] font-semibold text-white/65">Pembayaran resmi Dimsum Lumer</p>
        </div>
        <div className="flex h-12 w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-white p-1.5 shadow-lg shadow-black/10 sm:h-14 sm:w-[122px]">
          <img src={logoSrc} alt={`Logo ${config.label}`} className="h-full w-full object-contain" />
        </div>
      </div>

      <div className="space-y-3 border-t border-white/20 pt-4">
        {accountNumber && <div className="flex items-end justify-between gap-3"><div className="min-w-0"><p className="text-[9px] font-medium text-white/65">Nomor rekening / tujuan pembayaran</p><p className="mt-1 truncate text-base font-black tracking-[.1em] text-white sm:text-lg">{accountNumber}</p>{recipientName && <p className="mt-0.5 truncate text-[9px] font-semibold text-white/65">a.n. {recipientName}</p>}</div><button type="button" onClick={copyAccount} className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-3 text-[9px] font-extrabold text-white backdrop-blur transition hover:bg-white/25 active:scale-95">{copied === 'account' ? <Check size={13} /> : <Copy size={13} />}{copied === 'account' ? 'Tersalin' : 'Salin norek'}</button></div>}
        <div className="min-w-0"><p className="text-[9px] font-medium text-white/65">Nomor Pesanan</p><p className="mt-1 truncate text-[10px] font-extrabold tracking-wide text-white sm:text-xs">{orderCode || '-'}</p></div>
      </div>
    </div>
  </section>;
}

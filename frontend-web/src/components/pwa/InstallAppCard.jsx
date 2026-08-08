import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export default function InstallAppCard() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('hide-install-card') === '1');

  useEffect(() => {
    const handlePrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  if (!installPrompt || hidden || window.matchMedia('(display-mode: standalone)').matches) return null;

  const install = async () => {
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };
  const dismiss = () => {
    sessionStorage.setItem('hide-install-card', '1');
    setHidden(true);
  };

  return (
    <section className="px-3 xs:px-4 mt-5">
      <div className="relative overflow-hidden rounded-2xl bg-dark text-white p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/10 grid place-items-center shrink-0"><Smartphone size={22} /></div>
        <div className="min-w-0 flex-1"><h2 className="text-xs font-bold">Pasang aplikasi Dimsum Lumer</h2><p className="text-[10px] text-white/60 mt-0.5">Pesan lebih cepat langsung dari layar utama.</p></div>
        <button onClick={install} className="min-h-9 px-3 rounded-xl bg-primary text-[10px] font-bold flex items-center gap-1.5"><Download size={13} /> Pasang</button>
        <button onClick={dismiss} className="absolute top-1 right-1 text-white/40 p-1" aria-label="Tutup penawaran instalasi"><X size={12} /></button>
      </div>
    </section>
  );
}

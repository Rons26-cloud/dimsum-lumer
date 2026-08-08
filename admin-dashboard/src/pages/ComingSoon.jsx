import { Construction } from 'lucide-react';

export default function ComingSoon({ title = 'Modul' }) {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div className="max-w-sm text-center bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto"><Construction size={27} /></div>
        <h1 className="mt-4 text-lg font-bold">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">Modul ini sudah masuk navigasi aplikasi dan siap dilanjutkan dengan kebutuhan operasional UMKM.</p>
      </div>
    </div>
  );
}

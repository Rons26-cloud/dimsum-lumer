import React from 'react';
import { Wrench, Clock, MessageSquare } from 'lucide-react';
import { useMaintenance } from '../../hooks/useMaintenance.js';
import Loading from '../ui/Loading.jsx';

/**
 * Komponen Halaman Maintenance
 * Ditampilkan ketika mode perbaikan sistem aktif.
 */
export function MaintenancePage({ message }) {
  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 max-w-md w-full p-8 text-center relative overflow-hidden">
        {/* Dekorasi Background Halus */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />

        {/* Ilustrasi Ikon / Emoji Dimsum dengan Badge Wrench */}
        <div className="relative w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">🥟</span>
          <div className="absolute -bottom-1 -right-1 bg-orange-600 text-white p-1.5 rounded-full shadow-sm">
            <Wrench size={14} />
          </div>
        </div>

        {/* Judul & Pesan */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          Sedang Dalam Perbaikan
        </h1>
        
        <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-6">
          {message || 'Mohon maaf atas ketidaknyamanannya. Kami sedang meningkatkan kualitas layanan dan sistem Dimsum Lumer agar menjadi lebih baik. Silakan kunjungi kembali beberapa saat lagi!'}
        </p>

        {/* Estimasi / Status Waktu */}
        <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
          <Clock size={13} />
          <span>Sistem akan segera kembali normal</span>
        </div>

        {/* Informasi Kontak Bantuan (Opsional) */}
        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-center gap-1">
          <MessageSquare size={13} className="text-orange-500" />
          <span>Butuh bantuan mendesak? Hubungi admin kami.</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Membungkus seluruh App — kalau admin mengaktifkan mode maintenance dari
 * dashboard (realtime), seluruh website customer otomatis menampilkan halaman ini.
 */
export default function MaintenanceGuard({ children }) {
  const { isMaintenance, message, loading } = useMaintenance();

  if (loading) return <Loading fullscreen />;
  if (isMaintenance) return <MaintenancePage message={message} />;

  return children;
}
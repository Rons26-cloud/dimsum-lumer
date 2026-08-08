import React from 'react';
import { Wrench, Clock, MessageSquare } from 'lucide-react';
import { useMaintenance } from '../../hooks/useMaintenance.js';
import Loading from '../ui/Loading.jsx';
import logo from '../../assets/logo/logo.png';

/**
 * Komponen Halaman Maintenance
 * Ditampilkan ketika mode perbaikan sistem aktif.
 */
export function MaintenancePage({ message }) {
  return (
    <div className="min-h-screen bg-orange-50/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 max-w-lg w-full p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Dekorasi Garis Atas */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />

        {/* Logo PNG dengan badge Wrench */}
        <div className="relative w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm p-1">
          <img src={logo} alt="Dimsum Lumer" className="w-full h-full rounded-full object-cover" />
          <div className="absolute -bottom-1 -right-1 bg-orange-600 text-white p-1.5 rounded-full shadow-sm">
            <Wrench size={14} />
          </div>
        </div>

        {/* Judul Utama */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
          Sedang Dalam Perbaikan
        </h1>
        
        <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
          {message || 'Kami sedang melakukan pemeliharaan sistem terjadwal untuk meningkatkan kenyamanan Anda memesan dimsum favorit. Silakan cek kembali beberapa saat lagi.'}
        </p>

        {/* Kotak Informasi Tambahan */}
        <div className="bg-orange-50/50 rounded-xl border border-orange-100 p-5 sm:p-6 max-w-md mx-auto text-left mb-6">
          <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
            <span>🥟</span> Apa yang sedang kami lakukan?
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
            Kami sedang memperbarui sistem dan performa aplikasi <span className="font-medium text-orange-600">Dimsum Lumer</span> agar proses pemesanan menjadi jauh lebih cepat dan lancar. Terima kasih atas kesabaran Anda!
          </p>
        </div>

        {/* Estimasi / Status Waktu */}
        <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
          <Clock size={13} />
          <span>Sistem akan segera kembali normal</span>
        </div>

        {/* Informasi Kontak Bantuan */}
        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-center gap-1">
          <MessageSquare size={13} className="text-orange-500" />
          <span>Butuh bantuan mendesak? Hubungi admin kami melalui WhatsApp.</span>
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
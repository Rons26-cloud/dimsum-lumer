import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Komponen Modal
 * Menampilkan jendela dialog pop-up di tengah layar untuk interaksi atau konfirmasi khusus.
 */
export default function Modal({ isOpen, onClose, children, title, className = "" }) {
  // Mengunci scroll bodi saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Kontainer Modal Card */}
      <div className={`relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100 z-10 animate-scale-up ${className}`.trim()}>
        {/* Header Modal */}
        <div className="flex items-center justify-between mb-4">
          {title ? (
            <h2 className="text-lg font-bold text-dark pr-6">{title}</h2>
          ) : (
            <div />
          )}
          
          {/* Tombol Close */}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Konten Modal */}
        <div className="text-gray-600 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
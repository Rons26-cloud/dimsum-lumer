import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Komponen Drawer
 * Menampilkan panel laci geser dari sisi layar (kiri, kanan, atas, atau bawah).
 */
export default function Drawer({ isOpen, onClose, children, position = 'right', title = '' }) {
  // Mengunci scroll bodi saat drawer terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Konfigurasi posisi dan animasi
  const positionStyles = {
    left: 'left-0 top-0 h-full w-80 max-w-[85vw] border-r border-gray-100',
    right: 'right-0 top-0 h-full w-80 max-w-[85vw] border-l border-gray-100',
    top: 'top-0 left-0 w-full max-h-[85vh] border-b border-gray-100',
    bottom: 'bottom-0 left-0 w-full max-h-[85vh] rounded-t-2xl border-t border-gray-100'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div 
        className={`absolute bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          positionStyles[position] || positionStyles.right
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Drawer (Opsional jika ada judul atau tombol close bawaan) */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-base">{title}</h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Konten Utama Drawer */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
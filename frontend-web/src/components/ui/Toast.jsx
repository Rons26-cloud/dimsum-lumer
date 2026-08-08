import React, { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const types = {
  success: {
    bg: 'bg-emerald-600 text-white border-emerald-700',
    icon: <CheckCircle2 size={18} className="text-white" />
  },
  error: {
    bg: 'bg-red-600 text-white border-red-700',
    icon: <XCircle size={18} className="text-white" />
  },
  warning: {
    bg: 'bg-amber-500 text-white border-amber-600',
    icon: <AlertTriangle size={18} className="text-white" />
  },
  info: {
    bg: 'bg-primary text-white border-primary-600',
    icon: <Info size={18} className="text-white" />
  }
}

/**
 * Komponen Toast
 * Menampilkan pesan pemberitahuan mengambang sementara di sudut layar.
 */
export default function Toast({ message, type = 'success', duration = 3000, onClose, className = '' }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!visible) return null

  const currentType = types[type] || types.success

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md animate-fade-in ${currentType.bg} max-w-sm ${className}`.trim()}>
      <div className="flex-shrink-0">
        {currentType.icon}
      </div>
      <p className="text-sm font-medium leading-snug flex-1">
        {message}
      </p>
      <button
        type="button"
        onClick={() => {
          setVisible(false)
          onClose?.()
        }}
        className="flex-shrink-0 text-white/80 hover:text-white p-1 rounded-full transition-colors"
        aria-label="Tutup"
      >
        <X size={16} />
      </button>
    </div>
  )
}
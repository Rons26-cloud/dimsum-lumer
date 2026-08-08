import { X } from "lucide-react";

/**
 * Komponen Chip
 * Komponen UI dasar untuk kategori atau tag/badge dengan opsi tombol tutup (close).
 */
export default function Chip({ 
  category, 
  active, 
  onClick, 
  children, 
  onClose, 
  className = '', 
  ...props 
}) {
  // Jika digunakan sebagai Chip Kategori
  if (category) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
          active 
            ? 'bg-primary text-white shadow-sm' 
            : 'bg-white text-gray-700 border border-gray-100 hover:bg-gray-50'
        } ${className}`.trim()}
        {...props}
      >
        {category.emoji && <span>{category.emoji}</span>}
        <span>{category.name}</span>
      </button>
    )
  }

  // Jika digunakan sebagai Chip umum (dengan children & tombol close)
  return (
    <div 
      className={`inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200/60 px-3 py-1 rounded-full text-xs font-medium ${className}`.trim()} 
      {...props}
    >
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-primary-600 hover:text-primary-900 focus:outline-none p-0.5 rounded-full hover:bg-primary-100 transition-colors"
          aria-label="Tutup"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
import { useEffect } from "react";
import { X } from "lucide-react";


export default function Modal({ isOpen, onClose, children, title, className = "" }) {
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
      {}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {}
      <div className={`relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100 z-10 animate-scale-up ${className}`.trim()}>
        {}
        <div className="flex items-center justify-between mb-4">
          {title ? (
            <h2 className="text-lg font-bold text-dark pr-6">{title}</h2>
          ) : (
            <div />
          )}
          
          {}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {}
        <div className="text-gray-600 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
import { PackageOpen } from "lucide-react";
import React from "react";

/**
 * Komponen EmptyState
 * Menampilkan pesan kosong, ikon/ilustrasi, dan tombol aksi opsional saat data belum tersedia.
 */
export default function EmptyState({ 
  title = "Belum ada data", 
  description, 
  icon: Icon = PackageOpen, 
  action,
  className = "" 
}) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    if (typeof Icon === "function" || typeof Icon === "object") {
      const Component = Icon;
      return <Component size={26} strokeWidth={1.5} />;
    }
    return null;
  };

  return (
    <div className={`flex flex-col items-center justify-center py-14 sm:py-16 text-center px-4 animate-fade-in ${className}`.trim()}>
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3 border border-gray-100 shadow-xs">
        {renderIcon()}
      </div>
      <h3 className="font-semibold text-dark text-sm mb-1">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-gray-500 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5 flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
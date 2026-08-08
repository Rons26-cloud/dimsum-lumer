import { useState } from 'react';

/**
 * Komponen Avatar
 * Komponen UI dasar untuk menampilkan foto profil, inisial nama, atau ikon default.
 */
export default function Avatar({ src, alt = 'Avatar', name, size = 'md', className = '', ...props }) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  };

  const getInitials = (str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-700 font-semibold overflow-hidden shrink-0 ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <svg
          className="w-1/2 h-1/2 text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </div>
  );
}
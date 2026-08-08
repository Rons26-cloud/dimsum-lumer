/**
 * Komponen Skeleton
 * Menampilkan animasi kotak placeholder saat konten sedang dimuat.
 */
export default function Skeleton({ className = "h-4 w-full", ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-xl ${className}`.trim()}
      {...props}
    />
  );
}
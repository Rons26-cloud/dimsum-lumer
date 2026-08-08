/**
 * Komponen Footer
 * Menampilkan informasi footer web untuk tampilan desktop.
 */
export default function Footer({ className = "" }) {
  return (
    <footer className={`hidden md:block bg-dark text-gray-300 mt-16 ${className}`.trim()}>
      <div className="max-w-6xl mx-auto px-4 py-10 text-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-white font-bold text-lg mb-1">Dimsum Lumer</p>
          <p className="max-w-xs text-gray-400">Dimsum lumer autentik, dibuat segar setiap hari.</p>
        </div>
        <p className="text-gray-500 text-xs">© {new Date().getFullYear()} Dimsum Lumer. All rights reserved.</p>
      </div>
    </footer>
  );
}
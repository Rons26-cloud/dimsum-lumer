export default function Footer({ className = "" }) {
  return <footer className={`mt-16 hidden bg-dark text-gray-300 md:block ${className}`.trim()}>
    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 md:flex-row md:items-center">
      <div><p className="mb-1 text-lg font-bold text-white">Dimsum Lumer</p><p className="max-w-sm text-sm leading-6 text-gray-400">Gurih di Luar, Lumer di Dalam. Dibuat dengan perhatian pada rasa, kualitas, dan setiap detail penyajian.</p></div>
      <p className="text-xs text-gray-500">© {new Date().getFullYear()} Dimsum Lumer.<br/>Hak cipta dilindungi.</p>
    </div>
  </footer>;
}

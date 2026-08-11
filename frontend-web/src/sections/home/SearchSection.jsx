import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";

export default function SearchSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const submit = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/produk?q=${encodeURIComponent(value)}` : "/produk");
  };

  return (
    <section className="px-3 xs:px-4 pt-4">
      <form onSubmit={submit} className="flex items-center gap-2.5 bg-gray-100 rounded-2xl px-3.5 sm:px-4 min-h-12 focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-white transition-all">
        <Search size={18} className="text-gray-400 shrink-0" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Cari produk atau kategori…" className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" aria-label="Cari produk" />
        <button type="button" onClick={() => navigate('/produk')} className="w-8 h-8 rounded-lg grid place-items-center text-gray-400 hover:text-primary" aria-label="Buka semua produk"><SlidersHorizontal size={18} /></button>
      </form>
    </section>
  );
}

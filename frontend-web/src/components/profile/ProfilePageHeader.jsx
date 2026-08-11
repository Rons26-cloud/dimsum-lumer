import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfilePageHeader({ title, action = null }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 -mx-3 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-end border-b border-slate-200 bg-white px-3 pb-2 pt-[env(safe-area-inset-top)] shadow-sm">
      <button type="button" onClick={() => navigate(-1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-transparent text-slate-900 transition-colors active:bg-slate-100 active:text-primary" aria-label="Kembali">
        <ArrowLeft size={19} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-center text-sm font-extrabold text-slate-950">{title}</h1>
      <span className="flex min-h-10 min-w-10 items-center justify-end">{action}</span>
    </header>
  );
}

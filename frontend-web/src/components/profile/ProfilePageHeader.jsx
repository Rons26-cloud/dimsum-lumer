import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfilePageHeader({ title, action = null }) {
  const navigate = useNavigate();
  return (
    <header className="flex h-12 items-center border-b border-gray-100 bg-transparent px-1">
      <button type="button" onClick={() => navigate(-1)} className="grid h-9 w-9 shrink-0 place-items-center bg-transparent text-dark active:text-primary" aria-label="Kembali">
        <ArrowLeft size={19} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-center text-xs font-extrabold text-dark">{title}</h1>
      <span className="flex min-h-9 min-w-9 items-center justify-end">{action}</span>
    </header>
  );
}

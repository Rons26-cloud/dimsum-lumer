import { Outlet, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "../assets/logo/logo.png";

export default function AuthLayout() {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/95 pt-[max(env(safe-area-inset-top),0.375rem)] backdrop-blur-md">
        <div className="relative mx-auto flex h-14 w-full max-w-md items-center justify-center px-4 sm:h-16">
          <button
            type="button"
            onClick={goBack}
            className="absolute left-2 grid h-11 w-11 place-items-center rounded-full bg-transparent p-0 text-dark active:bg-orange-50 active:text-primary"
            aria-label="Kembali ke menu"
          >
            <ArrowLeft size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Dimsum Lumer" className="h-10 w-10 object-contain" />
            <span className="text-sm font-extrabold text-dark">Dimsum Lumer</span>
          </Link>
        </div>
      </header>
      <main className="flex min-h-dvh items-center justify-center px-3 pb-5 pt-[calc(4.5rem+env(safe-area-inset-top))] sm:pt-[calc(5rem+env(safe-area-inset-top))]">
        <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { Link } from "react-router-dom";
import { CookingPot } from "lucide-react";
 import Button from "../components/ui/Button.jsx";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-full bg-primary-50 text-primary flex items-center justify-center mb-3">
        <CookingPot size={28} strokeWidth={1.8} />
      </div>
      <h1 className="text-lg xs:text-xl font-bold text-dark">Halaman Tidak Ditemukan</h1>
      <p className="text-sm text-gray-500 mt-1">Coba periksa kembali alamat halamannya.</p>
      <Link to="/"><Button className="mt-6">Kembali ke Beranda</Button></Link>
    </div>
  );
}

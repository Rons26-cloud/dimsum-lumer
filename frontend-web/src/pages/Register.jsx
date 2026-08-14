import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { signUp, signInWithGoogle } from "../services/authService.js";
import Button from "../components/ui/Button.jsx";

export default function Register() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const sanitizedEmail = form.email.trim().toLowerCase();
      
      if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) throw new Error("Kata sandi minimal 8 karakter dan harus berisi huruf serta angka.");
      const phone = form.phone.replace(/[^0-9+]/g, "");
      const result = await signUp({
        email: sanitizedEmail,
        password: form.password,
        fullName: form.fullName.trim(),
        phone,
      });
      if (result.session) {
        navigate("/", { replace: true });
        return;
      }
      setSuccess("Pendaftaran berhasil. Silakan buka email konfirmasi, lalu masuk menggunakan akun Anda.");
      setForm((current) => ({ ...current, password: "" }));
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mendaftar. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "Gagal mendaftar dengan Google. Silakan coba lagi.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full bg-white flex flex-col justify-between px-2 py-4 max-w-md mx-auto">
      <div>
        {}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-gray-900">Daftar Akun</h1>
          <p className="text-gray-500 text-xs mt-1">Buat akun untuk mulai memesan dimsum</p>
        </div>

        {}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-xs font-medium text-center">{error}</p>
            </div>
          )}
          {success && <div className="rounded-xl border border-green-200 bg-green-50 p-3"><p className="text-center text-xs font-medium text-green-700">{success}</p></div>}

          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus-within:bg-white focus-within:border-orange-500 transition">
            <User size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              required
              placeholder="Nama Lengkap"
              className="professional-text-field w-full"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus-within:bg-white focus-within:border-orange-500 transition">
            <Mail size={18} className="text-gray-400 shrink-0" />
            <input
              type="email"
              required
              placeholder="Email"
              className="professional-text-field w-full"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus-within:bg-white focus-within:border-orange-500 transition">
            <Phone size={18} className="text-gray-400 shrink-0" />
            <input
              type="tel"
              required
              placeholder="No. HP"
              className="professional-text-field w-full"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus-within:bg-white focus-within:border-orange-500 transition">
            <Lock size={18} className="text-gray-400 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Kata Sandi"
              className="professional-text-field w-full"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition disabled:opacity-60 shadow-md shadow-orange-500/20 text-sm mt-2"
          >
            {loading ? "Memproses..." : "Daftar"}
          </Button>
        </form>

        {}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="px-3 text-xs text-gray-400 font-medium">Atau daftar dengan</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        {}
        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition disabled:opacity-60 shadow-sm text-sm"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.2v3.15C3.21 21.32 7.32 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.2C.44 8.13 0 9.99 0 12s.44 3.87 1.2 5.42l4.08-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.32 0 3.21 2.68 1.2 6.58l4.08 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>{googleLoading ? "Menghubungkan ke Google..." : "Google"}</span>
        </button>
      </div>

      {}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-orange-600 font-semibold hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

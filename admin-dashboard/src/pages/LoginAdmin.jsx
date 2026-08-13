import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { signInAdmin } from "../services/authService.js";

export default function LoginAdmin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInAdmin(form);
      navigate("/mfa", { replace: true });
    } catch (loginError) {
      setError(loginError.message === "Invalid login credentials" ? "Email atau password tidak cocok. Hapus autofill browser lalu ketik ulang password." : loginError.message || "Login gagal. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="font-bold text-lg text-center text-gray-800">Masuk ke Dashboard</h1>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <input
        type="email"
        autoComplete="email"
        required
        placeholder="Email admin"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <div className="relative"><input type={showPassword?"text":"password"} autoComplete="current-password" required placeholder="Kata sandi" className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary/30" value={form.password} onChange={(event)=>setForm({...form,password:event.target.value})}/><button type="button" onClick={()=>setShowPassword((visible)=>!visible)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-gray-400" aria-label={showPassword?"Sembunyikan password":"Tampilkan password"}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary-600 disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}

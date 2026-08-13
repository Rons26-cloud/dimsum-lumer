import { Outlet } from "react-router-dom";
import logo from "../assets/logo/logo.png";
import AdminThemeToggle from "../components/theme/AdminThemeToggle.jsx";

export default function AuthLayout() {
  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-[#F7F8FA] px-4">
      <AdminThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Dimsum Lumer" className="w-16 h-16 rounded-full object-cover mb-2" />
          <p className="font-bold text-dark">Dimsum Lumer</p>
          <p className="text-xs text-gray-400">Admin Dashboard</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

import { Moon, Sun } from "lucide-react";
import { useAdminTheme } from "../../theme/AdminThemeContext.jsx";

export default function AdminThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useAdminTheme();
  return <button type="button" onClick={toggleTheme} className={`admin-theme-toggle grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 shadow-sm transition active:scale-95 ${className}`} aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"} title={isDark ? "Mode terang" : "Mode gelap"}>{isDark ? <Sun size={18}/> : <Moon size={18}/>}</button>;
}

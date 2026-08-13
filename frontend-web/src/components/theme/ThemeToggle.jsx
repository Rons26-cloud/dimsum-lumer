import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber-200/70 bg-amber-50 text-amber-700 shadow-sm transition active:scale-95 ${className}`}
      aria-label={isDark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
    >
      {isDark ? <Sun size={18} strokeWidth={2.2} /> : <Moon size={18} strokeWidth={2.2} />}
    </button>
  );
}

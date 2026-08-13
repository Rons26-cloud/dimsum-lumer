import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dimsum-lumer-admin-theme";
const AdminThemeContext = createContext(null);

function getInitialTheme() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* storage may be unavailable */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.adminTheme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "dark" ? "#0d0b08" : "#E96818",
  );
}

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export function AdminThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    applyTheme(theme);
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* noop */ }
  }, [theme]);
  const value = useMemo(() => ({
    theme,
    isDark: theme === "dark",
    toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark"),
  }), [theme]);
  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
}

export function useAdminTheme() {
  const value = useContext(AdminThemeContext);
  if (!value) throw new Error("useAdminTheme harus digunakan dalam AdminThemeProvider");
  return value;
}

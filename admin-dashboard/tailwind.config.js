/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#E96818", 50: "#FFF7ED", 100: "#FFEDD5", 500: "#E96818", 600: "#D85B0D", 700: "#B94708" },
        cream: "#FFF7ED",
        whatsapp: "#25D366",
        sidebar: "#111827",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};

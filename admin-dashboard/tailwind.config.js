/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#FF7A00", 50: "#FFF8F2", 100: "#FFE8D1", 500: "#FF7A00", 600: "#E96F00", 700: "#C95F00" },
        cream: "#FFF8F2",
        whatsapp: "#25D366",
        sidebar: "#1C1F26",
      },
      fontFamily: { sans: ["Poppins", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};

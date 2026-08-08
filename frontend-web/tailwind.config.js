/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF7A00",
          50: "#FFF8F2",
          100: "#FFE8D1",
          500: "#FF7A00",
          600: "#E96F00",
          700: "#C95F00",
          900: "#7A3900",
        },
        accent: {
          DEFAULT: "#FFC107",
          600: "#F5A800",
        },
        dark: "#1D1D1D",
        cream: "#FFF8F2",
        whatsapp: "#25D366",
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 4px 16px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

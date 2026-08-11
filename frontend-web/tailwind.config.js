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
          DEFAULT: "#E96818",
          50: "#FFF7ED",
          100: "#FFEDD5",
          500: "#E96818",
          600: "#D85B0D",
          700: "#B94708",
          900: "#7C2D12",
        },
        accent: {
          DEFAULT: "#FFC107",
          600: "#F5A800",
        },
        dark: "#0F172A",
        cream: "#FFF7ED",
        whatsapp: "#25D366",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 8px 24px rgba(15,23,42,0.07)",
      },
    },
  },
  plugins: [],
};

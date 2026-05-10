/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#020617", // Slate-950 (even darker for premium feel)
        foreground: "#f8fafc",
        primary: {
          DEFAULT: "#2dd4bf", // Teal-400
          foreground: "#020617",
        },
        card: "#0f172a", // Slate-900
        border: "#1e293b", // Slate-800
      },
    },
  },
  plugins: [],
}

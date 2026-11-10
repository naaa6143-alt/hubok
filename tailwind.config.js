/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#faf7f0", navy: { DEFAULT: "#13293d", 700: "#1b3a57", 900: "#0b1a29" },
        gold: { DEFAULT: "#b8932f", 400: "#d4b25a", 100: "#f6edd2" },
      },
      fontFamily: { sans: ["Tajawal", "system-ui", "sans-serif"], amiri: ["Amiri", "serif"] },
      keyframes: { rise: { from: { opacity: 0, transform: "translateY(24px)" }, to: { opacity: 1, transform: "none" } } },
      animation: { rise: "rise .7s ease both" },
    },
  },
  plugins: [],
};

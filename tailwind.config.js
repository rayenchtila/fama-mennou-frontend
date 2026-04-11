/** @type {import('tailwindcss').Config} */
module.exports = {
   darkMode: 'class',   // ← this is required
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        dm: ["DM Sans", "sans-serif"],
      },
      colors: {
        brand: {
          violet: "#7c3aed",
          "violet-light": "#a78bfa",
          cyan: "#06b6d4",
          "cyan-light": "#67e8f9",
          fuchsia: "#d946ef",
        },
      },
      animation: {
        "orb-1": "orb1 15s ease-in-out infinite",
        "orb-2": "orb2 18s ease-in-out infinite",
        "orb-3": "orb3 12s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease forwards",
        shimmer: "shimmer 2s infinite",
        "gradient-move": "gradientMove 4s ease infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "slide-in": "slideIn 0.3s ease forwards",
      },
      keyframes: {
        orb1: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(80px,60px) scale(1.1)" },
          "66%": { transform: "translate(-40px,100px) scale(0.9)" },
        },
        orb2: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(-60px,80px) scale(1.05)" },
          "66%": { transform: "translate(40px,-60px) scale(0.95)" },
        },
        orb3: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(100px,-80px) scale(1.1)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)", opacity: "0.3" },
          "50%": { transform: "translateY(-30px)", opacity: "0.8" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        gradientMove: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        slideIn: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      backgroundSize: {
        "200%": "200% 200%",
      },
    },
  },
  plugins: [],
};

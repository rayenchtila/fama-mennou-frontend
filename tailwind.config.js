/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        syne:    ["Syne", "sans-serif"],
        dm:      ["DM Sans", "sans-serif"],
        inter:   ["Inter", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        // Legacy brand colors (kept for existing components)
        brand: {
          violet: "#7c3aed",
          "violet-light": "#a78bfa",
          cyan: "#06b6d4",
          "cyan-light": "#67e8f9",
          fuchsia: "#d946ef",
        },
        // Fama Mennou design tokens
        fm: {
          bg:       "#0a0817",
          bg2:      "#0c0a1e",
          bg3:      "#100d28",
          card:     "#16142e",
          card2:    "#15122c",
          primary:  "#7c6cf6",
          "primary-light": "#9b8cff",
          "primary-dark":  "#6a5cf0",
          blue:     "#6c8cf6",
          cyan:     "#3ec2e8",
          purple:   "#a855f7",
          "text-1": "#fbfbff",
          "text-2": "#f4f3fb",
          "text-3": "#dcdef0",
          "text-4": "#c2c5dd",
          "text-5": "#a7abc8",
          "text-6": "#7e82a0",
          "text-7": "#62668a",
        },
      },
      animation: {
        // Legacy animations
        "orb-1": "orb1 15s ease-in-out infinite",
        "orb-2": "orb2 18s ease-in-out infinite",
        "orb-3": "orb3 12s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease forwards",
        shimmer: "shimmer 2s infinite",
        "gradient-move": "gradientMove 4s ease infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "slide-in": "slideIn 0.3s ease forwards",
        // Fama Mennou animations
        "glow-float": "glowFloat 4s ease-in-out infinite",
        "brand-in":   "brandIn 0.9s cubic-bezier(0.2,0.7,0.2,1) both",
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
      },
      keyframes: {
        // Legacy keyframes
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
          to:   { opacity: "1", transform: "translateY(0)" },
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
          to:   { transform: "translateX(0)", opacity: "1" },
        },
        // Fama Mennou keyframes
        glowFloat: {
          "0%,100%": { filter: "drop-shadow(0 0 10px rgba(108,140,246,0.45))" },
          "50%":     { filter: "drop-shadow(0 0 18px rgba(108,140,246,0.75))" },
        },
        brandIn: {
          "0%":   { opacity: "0", letterSpacing: "0.16em" },
          "100%": { opacity: "1", letterSpacing: "-0.01em" },
        },
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundSize: {
        "200%": "200% 200%",
      },
    },
  },
  plugins: [],
};

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
        // Plus Jakarta Sans has no Arabic glyphs; Noto Sans Arabic picks those
        // up per-character so FR/EN and AR copy share one visual weight.
        ds:      ["Plus Jakarta Sans", "Noto Sans Arabic", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      // Typographic scale from DESIGN.md (headline-xl … label-sm). `-m` = the
      // mobile cut of the same role. Weight/tracking travel with the size so a
      // single `text-h-xl` class reproduces the whole token.
      fontSize: {
        "h-xl":   ["3.5rem",    { lineHeight: "4rem",    letterSpacing: "-0.03em",  fontWeight: "800" }],
        "h-xl-m": ["2.25rem",   { lineHeight: "2.75rem", letterSpacing: "-0.025em", fontWeight: "800" }],
        "h-lg":   ["2.5rem",    { lineHeight: "3rem",    letterSpacing: "-0.025em", fontWeight: "700" }],
        "h-lg-m": ["1.75rem",   { lineHeight: "2.25rem", letterSpacing: "-0.02em",  fontWeight: "700" }],
        "h-md":   ["1.75rem",   { lineHeight: "2.25rem", letterSpacing: "-0.02em",  fontWeight: "700" }],
        "h-md-m": ["1.5rem",    { lineHeight: "2rem",    letterSpacing: "-0.02em",  fontWeight: "700" }],
        "h-sm":   ["1.25rem",   { lineHeight: "1.75rem", letterSpacing: "-0.015em", fontWeight: "600" }],
        "t-md":   ["1.0625rem", { lineHeight: "1.5rem",  letterSpacing: "-0.01em",  fontWeight: "600" }],
        "b-lg":   ["1.125rem",  { lineHeight: "1.75rem", letterSpacing: "-0.01em",  fontWeight: "400" }],
        "b-md":   ["0.9375rem", { lineHeight: "1.375rem", letterSpacing: "-0.005em", fontWeight: "400" }],
        "b-sm":   ["0.8125rem", { lineHeight: "1.125rem", letterSpacing: "0",        fontWeight: "400" }],
        "l-md":   ["0.875rem",  { lineHeight: "1.25rem", letterSpacing: "0.01em",   fontWeight: "600" }],
        "l-sm":   ["0.6875rem", { lineHeight: "1rem",    letterSpacing: "0.02em",   fontWeight: "600" }],
      },
      boxShadow: {
        "ds-card": "var(--ds-shadow-card)",
        "ds-pop":  "var(--ds-shadow-pop)",
        "ds-btn":  "var(--ds-shadow-btn)",
        "ds-glow": "var(--ds-glow)",
      },
      colors: {
        // Design-system tokens. Every value is an `R G B` channel triplet that
        // src/styles/design.css defines per theme (dark/light) and per accent
        // (indigo/emerald), so one class — `bg-ds-card`, `text-ds-mute`,
        // `bg-ds-accent/15` — follows both the theme toggle and the page accent.
        ds: {
          canvas:  "rgb(var(--ds-canvas) / <alpha-value>)",
          lowest:  "rgb(var(--ds-lowest) / <alpha-value>)",
          low:     "rgb(var(--ds-low) / <alpha-value>)",
          card:    "rgb(var(--ds-card) / <alpha-value>)",
          high:    "rgb(var(--ds-high) / <alpha-value>)",
          highest: "rgb(var(--ds-highest) / <alpha-value>)",
          ink:     "rgb(var(--ds-ink) / <alpha-value>)",
          "ink-2": "rgb(var(--ds-ink-2) / <alpha-value>)",
          mute:    "rgb(var(--ds-mute) / <alpha-value>)",
          faint:   "rgb(var(--ds-faint) / <alpha-value>)",
          accent:  "rgb(var(--ds-accent) / <alpha-value>)",
          fill:    "rgb(var(--ds-fill) / <alpha-value>)",
          "on-accent": "rgb(var(--ds-on-accent) / <alpha-value>)",
          "fill-2": "rgb(var(--ds-fill-2) / <alpha-value>)",
          ok:      "rgb(var(--ds-ok) / <alpha-value>)",
          warn:    "rgb(var(--ds-warn) / <alpha-value>)",
          bad:     "rgb(var(--ds-bad) / <alpha-value>)",
          info:    "rgb(var(--ds-info) / <alpha-value>)",
          line:           "rgb(var(--ds-line) / var(--ds-line-a))",
          "line-strong":  "rgb(var(--ds-line) / var(--ds-line-strong-a))",
          "accent-soft":  "rgb(var(--ds-accent) / var(--ds-accent-soft-a))",
          "accent-line":  "rgb(var(--ds-accent) / var(--ds-accent-line-a))",
        },
        // The brand panel of the log-in / sign-up screen. It is always the opposite of the page
        // (dark beside a light form, light beside a dark form), so these follow the theme in
        // reverse — design.css ("Auth") defines both sets.
        ap: {
          ink:      "rgb(var(--ap-ink) / <alpha-value>)",
          mute:     "rgb(var(--ap-mute) / <alpha-value>)",
          accent:   "rgb(var(--ap-accent) / <alpha-value>)",
          line:     "rgb(var(--ap-edge) / var(--ap-line-a))",
          tint:     "rgb(var(--ap-edge) / var(--ap-tint-a))",
          chip:     "rgb(var(--ap-chip) / var(--ap-chip-a))",
          "glow-1": "rgb(var(--ap-glow-1) / var(--ap-glow-a))",
          "glow-2": "rgb(var(--ap-glow-2) / var(--ap-glow-a))",
        },
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

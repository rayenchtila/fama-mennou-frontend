/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        fm: {
          bg:      '#0a0817',
          bg2:     '#0c0a1e',
          bg3:     '#100d28',
          card:    '#16142e',
          primary: '#7c6cf6',
          pl:      '#9b8cff',
          blue:    '#6c8cf6',
          cyan:    '#3ec2e8',
          purple:  '#a855f7',
          t1:      '#fbfbff',
          t2:      '#f4f3fb',
          t3:      '#dcdef0',
          t4:      '#c2c5dd',
          t5:      '#a7abc8',
          t6:      '#7e82a0',
          t7:      '#62668a',
        },
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%,100%': { filter: 'drop-shadow(0 0 10px rgba(124,108,246,.45))' },
          '50%':     { filter: 'drop-shadow(0 0 22px rgba(62,194,232,.75))' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp .6s cubic-bezier(.22,1,.36,1) both',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

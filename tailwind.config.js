/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'now-blue': '#1e3a8a',
        'now-purple': '#7c3aed',
        'now-orange': '#ea580c',
        'now-green': '#10b981',
        'now-red': '#ef4444',
        'now-teal': '#14b8a6',
        'now-dark': '#0f172a',
        'now-darker': '#020617',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'now-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #7c3aed 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
} 
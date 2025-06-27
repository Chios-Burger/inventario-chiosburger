/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'foodix-azul': '#001f3f',
        'foodix-rojo': '#dc2626',
        'foodix-rojo-claro': '#ef4444',
      },
      animation: {
        'slide-in': 'slide-in 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
        'colored': '0 10px 40px -10px rgba(102, 126, 234, 0.2)',
      },
    },
  },
  plugins: [],
}
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
      }
    },
  },
  plugins: [],
}
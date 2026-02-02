/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        finance: '#2563eb',
        vitality: '#10b981', // Preparado para tu módulo de Energía Vital
      }
    },
  },
  plugins: [],
}
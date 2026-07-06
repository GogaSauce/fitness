/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        card: '#1a1a1a',
        primary: '#f97316',
        sport: '#3b82f6',
        cardio: '#22c55e',
        secondary: '#9ca3af',
        line: '#2a2a2a',
      },
    },
  },
  plugins: [],
};

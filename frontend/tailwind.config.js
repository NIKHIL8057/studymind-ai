/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { 950: '#080d1c', 900: '#0f1629', 800: '#182139', 700: '#243050' },
      },
    },
  },
  plugins: [],
};

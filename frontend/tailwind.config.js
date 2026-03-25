/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        inter:    ['Inter', 'sans-serif'],
      },
      colors: {
        gold:  { DEFAULT: '#C9A84C', light: '#E2C97E', dark: '#A8832A' },
        brown: { DEFAULT: '#2C1A0E', light: '#4A2E1A', dark: '#1A0F08' },
        cream: { DEFAULT: '#FAF7F2', dark: '#F0EAE0' },
        brand: {
          50:  '#fdf4e7',
          100: '#fae3c0',
          500: '#e8a020',
          600: '#d4891a',
          700: '#b87015',
          900: '#7a4510',
        },
      },
    },
  },
  plugins: [],
}

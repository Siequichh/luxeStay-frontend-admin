/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['selector', '.app-dark'],
  corePlugins: {
    preflight: false, // avoid conflicts with PrimeNG base styles
  },
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5f0ff',
          100: '#ede0ff',
          200: '#d9c1ff',
          300: '#be96ff',
          400: '#a06af5',
          500: '#8347e6',
          600: '#6d2fcb',
          700: '#5a22a8',
          800: '#4a1d88',
          900: '#3d1a6e',
          950: '#260f4a',
          DEFAULT: '#64289B',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

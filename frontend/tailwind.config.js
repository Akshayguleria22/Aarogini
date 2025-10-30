/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#F6F4FA',
          100: '#EDE7F6',
          200: '#E1BEE7',
          300: '#CE93D8',
          400: '#9C73F8',
          500: '#9C27B0',
          600: '#8E24AA',
          700: '#7B1FA2',
          800: '#6A1B9A',
          900: '#4A3F72',
        },
        lavender: {
          50: '#F8F6FF',
          100: '#EDE7F8',
          200: '#E8D5FF',
          300: '#DCC4FF',
          400: '#C8A8FF',
          500: '#B085FF',
          600: '#9563EB',
          700: '#7C3AED',
          800: '#6D28D9',
          900: '#5B21B6',
        }
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0px 4px 12px rgba(0,0,0,0.05)',
        'wellness': '0px 8px 24px rgba(156, 115, 248, 0.15)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

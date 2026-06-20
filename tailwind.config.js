/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F8EF',
          100: '#C5EFD6',
          200: '#9FE0B8',
          300: '#6DD194',
          400: '#3CC77D',
          500: '#27A865',
          600: '#1E8A50',
          700: '#166C3D',
          800: '#0F4E2B',
          900: '#083018',
          DEFAULT: '#27A865',
          light: '#3CC77D',
          dark: '#1E8A50',
        },
        danger: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#E53935',
          600: '#C62828',
          700: '#B71C1C',
          light: '#FF6F60',
          DEFAULT: '#E53935',
        },
        warning: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          DEFAULT: '#FF9800',
        },
        accent: {
          DEFAULT: '#1565C0',
          light: '#1E88E5',
          dark: '#0D47A1',
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}', './public/**/*.html'],
  theme: {
    extend: {
      colors: {
        'brand-deep': '#031716',
        'brand-forest': '#032F30',
        'brand-teal': '#0A7075',
        'brand-teal-light': '#0C969C',
        'brand-ice': '#6BA3BE',
        'brand-slate': '#274D60',
      },
    },
  },
  plugins: [],
}

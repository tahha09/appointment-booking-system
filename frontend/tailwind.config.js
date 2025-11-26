/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/index.html', './src/**/*.{html,ts}'],
  safelist: [
    'from-rose-500',
    'to-rose-600',
    'from-amber-500',
    'to-orange-500',
    'from-emerald-500',
    'to-green-600',
    'from-indigo-500',
    'to-blue-600',
    'from-sky-500',
    'to-cyan-500',
    'from-violet-500',
    'to-purple-600',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

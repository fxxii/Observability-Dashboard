/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(15 17 23 / <alpha-value>)',
        panel:   'rgb(26 29 39 / <alpha-value>)',
        border:  'rgb(45 49 72 / <alpha-value>)',
      },
      fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
    },
  },
  plugins: [],
}


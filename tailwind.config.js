/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        n1: '#22c55e', // Green
        n2: '#eab308', // Yellow
        n3: '#ef4444', // Red
      }
    },
  },
  plugins: [],
}
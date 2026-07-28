/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",        // all files in app directory
    "./pages/**/*.{js,ts,jsx,tsx}",      // all files in pages directory
    "./components/**/*.{js,ts,jsx,tsx}"  // all files in components directory
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
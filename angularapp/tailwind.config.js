/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <--- Enables the toggle mechanism
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // These link directly to the CSS variables in styles.css
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.perspective-1000': { perspective: '1000px' },
        '.transform-style-3d': { transformStyle: 'preserve-3d' },
        '.backface-hidden': { backfaceVisibility: 'hidden' },
      });
    },
  ],
}
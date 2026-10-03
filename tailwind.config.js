/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF6EF',
        sand: '#F2EADD',
        linen: '#E8DCC8',
        line: '#E3D7C4',
        wine: { DEFAULT: '#5C1A2B', deep: '#3E0F1C', soft: '#7A2E40' },
        gold: { DEFAULT: '#A8834A', soft: '#C9AE7E', pale: '#EADBC0' },
        ink: { DEFAULT: '#2A2224', soft: '#5A4E4F', muted: '#8A7D7A' },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        brand: ['Marcellus', '"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: { brand: '0.22em', label: '0.16em' },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'none' } },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
        slideLeft: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'none' } },
      },
      animation: {
        rise: 'rise .9s cubic-bezier(.2,.7,.2,1) both',
        fade: 'fade .5s ease both',
        slideIn: 'slideIn .42s cubic-bezier(.2,.8,.2,1) both',
        slideLeft: 'slideLeft .38s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
}

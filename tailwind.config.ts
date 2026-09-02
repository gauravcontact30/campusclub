import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        /* The canvas: black cooled with violet so it never reads as flat #000 */
        noir: {
          DEFAULT: '#0A0711',
          900: '#050308',
          800: '#0A0711',
          700: '#130D20',
          600: '#1D1433',
          500: '#2B1F4A',
        },
        /* Light foreground. Tinted toward violet so text belongs to the palette
           instead of sitting on top of it as clinical white. */
        frost: {
          DEFAULT: '#F2EDFB',
          100: '#FBF9FF',
          200: '#DDD4F2',
          300: '#B4A7D0',
        },
        /* Signature purple. The ramp runs BRIGHTER as the number rises: on a black
           canvas emphasis means more light, not less. */
        orchid: {
          DEFAULT: '#A855F7',
          600: '#BC7BFF',
          700: '#D9B8FE',
          200: '#2C1550',
        },
        /* Parrot green — the counterweight that keeps the purple from going gothic */
        parrot: {
          DEFAULT: '#4ADE64',
          600: '#8DF5A6',
        },
        /* Lime highlight for ratings and small flourishes */
        zest: '#C8F751',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        /* Black drops nothing on black — depth has to come from a violet bloom */
        card: '0 1px 2px rgba(0,0,0,0.6), 0 14px 34px -14px rgba(0,0,0,0.85)',
        lift: '0 26px 64px -26px rgba(168,85,247,0.55)',
        glow: '0 0 0 1px rgba(168,85,247,0.28), 0 14px 44px -14px rgba(168,85,247,0.55)',
      },
      maxWidth: {
        page: '1240px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in .4s ease both',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

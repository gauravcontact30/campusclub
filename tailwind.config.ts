import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        /* Deep forest "ink" — the dark canvas the brand sits on */
        ink: {
          DEFAULT: '#0B1F17',
          900: '#081712',
          800: '#0B1F17',
          700: '#122C22',
          600: '#1B3B2E',
          500: '#2A5240',
        },
        /* Warm paper tones */
        cream: {
          DEFAULT: '#F8F4EA',
          100: '#FDFBF6',
          200: '#F1E9D9',
          300: '#E3D7C1',
        },
        /* Signature accent */
        flame: {
          DEFAULT: '#FF5C39',
          600: '#E8492A',
          700: '#C93A1F',
          200: '#FFD3C7',
        },
        sage: {
          DEFAULT: '#A8C3B0',
          600: '#6E9280',
        },
        gold: '#F5B942',
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
        card: '0 1px 2px rgba(11,31,23,0.06), 0 12px 32px -12px rgba(11,31,23,0.18)',
        lift: '0 24px 60px -24px rgba(11,31,23,0.45)',
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

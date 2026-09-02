import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        /* The canvas: black warmed with rose, so it never reads as flat #000 */
        noir: {
          DEFAULT: '#0D080A',
          900: '#070405',
          800: '#0D080A',
          700: '#170F13',
          600: '#23161C',
          500: '#34212A',
        },
        /* Light foreground. Warmed toward rose so text belongs to the palette
           instead of sitting on top of it as clinical white. */
        pearl: {
          DEFAULT: '#FBF1F4',
          100: '#FFFAFB',
          200: '#EBD5DC',
          300: '#C3A3AE',
        },
        /* Signature rose. Named `rouge` rather than `rose` on purpose: Tailwind
           ships a `rose` scale, and `extend` deep-merges, so a token called
           `rose` would leave `rose-500` meaning Tailwind's and `rose-600`
           meaning ours. The ramp runs BRIGHTER as the number rises — on a black
           canvas emphasis means more light, not less. */
        rouge: {
          DEFAULT: '#F43F5E',
          600: '#FF6478',
          700: '#FFB0C0',
          200: '#4A1220',
        },
        /* Lighter rose. Carries the affirmative signal — open now, confirmed. */
        blush: {
          DEFAULT: '#FF8FA3',
          600: '#FFC2CE',
        },
        /* The palest tint, for ratings and small flourishes */
        petal: '#FFD9E0',
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
        /* Black drops nothing on black — depth has to come from a rose bloom */
        card: '0 1px 2px rgba(0,0,0,0.6), 0 14px 34px -14px rgba(0,0,0,0.85)',
        lift: '0 26px 64px -26px rgba(244,63,94,0.55)',
        glow: '0 0 0 1px rgba(244,63,94,0.28), 0 14px 44px -14px rgba(244,63,94,0.55)',
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

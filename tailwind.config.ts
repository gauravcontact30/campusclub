import type { Config } from 'tailwindcss';

/** Reads a channel-triplet custom property while preserving `/opacity` support. */
const withAlpha = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        /* Colours live as CSS custom properties in globals.css, one set per
           theme, so the light/dark switch is a single attribute on <html>
           rather than a `dark:` variant on 700-odd class names. Values are
           space-separated RGB channels, which is what lets Tailwind's opacity
           modifiers (`text-content/60`) keep working. */
        canvas: {
          DEFAULT: withAlpha('--canvas'),
          900: withAlpha('--canvas-900'),
          800: withAlpha('--canvas-800'),
          700: withAlpha('--canvas-700'),
          600: withAlpha('--canvas-600'),
          500: withAlpha('--canvas-500'),
        },
        content: {
          DEFAULT: withAlpha('--content'),
          100: withAlpha('--content-100'),
          200: withAlpha('--content-200'),
          300: withAlpha('--content-300'),
        },
        /* Signature terracotta. Every token here is checked against Tailwind's
           own palette first: `extend` deep-merges, so a token sharing a name
           with a built-in scale (`rose`, `amber`, `orange`…) would leave
           `-500` meaning Tailwind's and `-600` meaning ours. `brand`,
           `signal` and `glint` collide with nothing. The ramp runs BRIGHTER
           as the number rises in dark and DARKER in light — see globals.css. */
        brand: {
          DEFAULT: withAlpha('--brand'),
          600: withAlpha('--brand-600'),
          700: withAlpha('--brand-700'),
          200: withAlpha('--brand-200'),
        },
        /* Warm gold. Carries the affirmative signal — open now, confirmed. */
        signal: {
          DEFAULT: withAlpha('--signal'),
          600: withAlpha('--signal-600'),
        },
        /* The palest tint, for ratings and small flourishes */
        glint: withAlpha('--glint'),
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
        /* Also per-theme: a shadow tuned for black is invisible on paper and a
           shadow tuned for paper is mud on black. */
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        glow: 'var(--shadow-glow)',
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

import type { Metadata, Viewport } from 'next';
import { Manrope, Noto_Sans_Devanagari, Sora } from 'next/font/google';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { ChatWidget } from '@/components/chat/chat-widget';
import { Providers } from './providers';
import { SITE } from '@/lib/constants';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import { getDictionary, getLocale } from '@/lib/i18n/server';
import { LocaleProvider } from '@/lib/i18n/client';
import './globals.css';

/**
 * Sora for headings — geometric, slightly technical, and it holds up at the
 * weight the display sizes need. Manrope underneath it for running text, which
 * is quieter and has the wider apertures small copy wants.
 */
const display = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

/**
 * Neither display nor body face carries Devanagari, so Hindi was falling back
 * to whatever the OS happened to have — different on every machine, and matched
 * to nothing. Loading one deliberately makes the Hindi typography a decision
 * rather than an accident. It is appended to both stacks, so Latin glyphs still
 * come from the brand faces and only Devanagari falls through to it.
 */
const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    type: 'website',
    url: SITE.url,
  },
  // One file at every size: the mark is two circles and a lens, so nothing is
  // lost at 16px and no simplified favicon variant is needed.
  icons: { icon: '/logo.svg', apple: '/logo.svg' },
};

export const viewport: Viewport = {
  // One per theme, so the browser chrome matches the page it frames.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F7FB' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0E14' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, dictionary] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <html
      lang={locale}
      // Next 16 stopped overriding `scroll-behavior` on navigation; this opts
      // back in, so route changes land instantly while in-page anchors glide.
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${devanagari.variable}`}
      // The blocking script below sets this before paint; `suppressHydrationWarning`
      // stops React complaining that the attribute it finds is not the one the
      // server rendered, which is the entire point of setting it early.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <LocaleProvider locale={locale} dictionary={dictionary}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand focus:px-5 focus:py-3 focus:text-on-brand"
          >
            {dictionary.common.skipToContent}
          </a>
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster />
          <ChatWidget />
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}

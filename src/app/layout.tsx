import type { Metadata, Viewport } from 'next';
import { Archivo, Fraunces, Noto_Sans_Devanagari } from 'next/font/google';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { ChatWidget } from '@/components/chat/chat-widget';
import { PageTracker } from '@/components/admin/page-tracker';
import { Providers } from './providers';
import { SITE } from '@/lib/constants';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import { getDictionary, getLocale } from '@/lib/i18n/server';
import { LocaleProvider } from '@/lib/i18n/client';
import './globals.css';

/**
 * The pairing carries the two halves of this design. Fraunces is a
 * high-contrast serif with a soft, slightly wonky warmth — the editorial voice
 * for headlines and the wordmark. Archivo is the working face underneath it:
 * a utilitarian grotesque with tight, legible small sizes, which is what a
 * dense result list and a filter sidebar actually need.
 */
const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Archivo({
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
  // One file at every size: the mark is an arc and a dot, so nothing is lost at
  // 16px and no simplified favicon variant is needed.
  icons: { icon: '/logo.svg', apple: '/logo.svg' },
};

export const viewport: Viewport = {
  // One per theme, so the browser chrome matches the page it frames.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF7F0' },
    { media: '(prefers-color-scheme: dark)', color: '#161311' },
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
          <PageTracker />
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}

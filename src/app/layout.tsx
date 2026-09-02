import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';
import { SITE } from '@/lib/constants';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
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
  // The detailed mark loses its seats at favicon scale, so a simplified variant
  // is offered for 16px and the full one for everything larger.
  icons: {
    icon: [
      { url: '/icon-16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/logo.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: '/logo.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0D080A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // Next 16 stopped overriding `scroll-behavior` on navigation; this opts
      // back in, so route changes land instantly while in-page anchors glide.
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-rouge focus:px-5 focus:py-3 focus:text-pearl"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

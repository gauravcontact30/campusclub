import Link from 'next/link';
import { Instagram, Linkedin, Twitter } from 'lucide-react';
import { CATEGORIES, CITIES, SITE } from '@/lib/constants';
import { Logo } from './logo';
import { BACKEND_MODE } from '@/lib/env';
import { PAYMENT_MODE } from '@/lib/payments/config';

const columns = [
  {
    title: 'Do',
    links: [
      ...CATEGORIES.slice(0, 6).map((c) => ({ href: `/meetups?category=${c.slug}`, label: c.name })),
      { href: '/meetups', label: `All ${CATEGORIES.length} activities →` },
    ],
  },
  {
    title: 'Members',
    links: [
      { href: '/meetups', label: 'What’s on' },
      { href: '/passes', label: 'Passes & join fees' },
      { href: '/my-meetups', label: 'Your meetups' },
      { href: '/saved', label: 'Saved meetups' },
      { href: '/how-it-works', label: 'How joining works' },
    ],
  },
  {
    title: 'Cities',
    // The rest of the 40-plus cities live at /cities — a footer column is a
    // wayfinding aid, not the whole directory.
    links: [
      ...CITIES.slice(0, 7).map((c) => ({ href: `/meetups?city=${c.slug}`, label: c.name })),
      { href: '/cities', label: `All ${CITIES.length} cities →` },
    ],
  },
  {
    title: 'Hosts & partners',
    links: [
      { href: '/host', label: 'Host a meetup' },
      { href: '/partners', label: 'Partner your venue' },
      { href: '/ambassadors', label: 'Campus ambassadors' },
      { href: '/how-it-works#hosting', label: 'What hosts earn' },
      { href: '/signup', label: 'Create an account' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About CampusClub' },
      { href: '/stories', label: 'Stories' },
      { href: '/careers', label: 'Careers' },
      { href: '/press', label: 'Press' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/help', label: 'Help centre' },
      { href: '/safety', label: 'Trust & safety' },
      { href: '/legal/refunds', label: 'Refund policy' },
      { href: '/legal/terms', label: 'Terms of service' },
      { href: '/legal/privacy', label: 'Privacy policy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-content/10 bg-canvas-900 text-content">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2.5fr]">
          <div className="space-y-5">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-content/60">{SITE.description}</p>
            <div className="flex gap-3">
              {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-content/20 text-content/70 transition-colors hover:border-brand hover:text-brand"
                >
                  <Icon size={16} />
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-content/50">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className="text-sm text-content/80 transition-colors hover:text-brand">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-content/15 pt-6 text-xs text-content/50 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>© {new Date().getFullYear()} {SITE.name}.</span>
            <Link href="/legal/terms" className="hover:text-brand">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-brand">Privacy</Link>
            <Link href="/legal/cookies" className="hover:text-brand">Cookies</Link>
          </p>
          {/* Two honest labels rather than a fake "secure payments" badge: this
              says out loud which database answered and which gateway is wired. */}
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-brand" aria-hidden />
              Data: {BACKEND_MODE === 'supabase' ? 'Supabase Postgres' : 'seeded demo dataset'}
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-signal" aria-hidden />
              Payments: {PAYMENT_MODE === 'razorpay' ? 'Razorpay' : 'demo gateway, nothing is charged'}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import { Instagram, Linkedin, Twitter } from 'lucide-react';
import { CATEGORIES, CITIES, SITE } from '@/lib/constants';
import { Logo } from './logo';
import { BACKEND_MODE } from '@/lib/env';

const columns = [
  {
    title: 'Discover',
    links: CATEGORIES.slice(0, 5).map((c) => ({ href: `/businesses?category=${c.slug}`, label: c.name })),
  },
  {
    title: 'Dinners',
    links: [
      { href: '/dinners', label: 'Upcoming tables' },
      { href: '/dinners/quiz', label: 'Matching questionnaire' },
      { href: '/pricing', label: 'Membership plans' },
      { href: '/how-it-works', label: 'How a dinner works' },
      { href: '/bookings', label: 'Your bookings' },
    ],
  },
  {
    title: 'Cities',
    links: CITIES.map((c) => ({ href: `/businesses?city=${c.slug}`, label: c.name })),
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About SitNext' },
      { href: '/add-business', label: 'List your business' },
      { href: '/how-it-works', label: 'Trust & safety' },
      { href: '/signup', label: 'Create an account' },
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

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
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
          <p>
            © {new Date().getFullYear()} {SITE.name}. Built with Next.js, React and Supabase.
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-brand" aria-hidden />
            Data source: {BACKEND_MODE === 'supabase' ? 'Supabase Postgres' : 'seeded demo dataset'}
          </p>
        </div>
      </div>
    </footer>
  );
}

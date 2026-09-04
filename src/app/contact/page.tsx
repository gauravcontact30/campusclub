import type { Metadata } from 'next';
import Link from 'next/link';
import { LifeBuoy, Mail, MessageSquareWarning, Newspaper, ShieldAlert, Store } from 'lucide-react';
import { PageHeader, NextUp } from '@/components/site/page-header';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with CampusClub — support, trust & safety, partnerships and press, by the right channel.',
};

/**
 * One inbox per reason, not one general inbox that gets triaged by a human
 * later — a report of harassment and a question about a delayed refund
 * should not sit in the same queue behind each other.
 */
const CHANNELS = [
  {
    icon: LifeBuoy,
    title: 'General support',
    body: 'Payments, refunds, an account issue, a bug on the site.',
    email: 'support@campusclub.app',
    reply: 'Usually within one working day',
  },
  {
    icon: ShieldAlert,
    title: 'Trust & safety',
    body: 'Something happened at a meetup, or a listing looks wrong.',
    email: 'trust@campusclub.app',
    reply: 'Read the same day, every day',
  },
  {
    icon: Store,
    title: 'Venues & partnerships',
    body: 'You run a space and want CampusClub meetups hosted there.',
    email: 'partners@campusclub.app',
    reply: 'Within three working days',
  },
  {
    icon: Newspaper,
    title: 'Press',
    body: 'Interview requests, data requests, the brand kit.',
    email: 'press@campusclub.app',
    reply: 'See the press page for what we can share',
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title="Write to the right inbox and it moves faster."
        lede="No contact form — an email a real person reads, sorted by what you actually need."
      />

      <div className="container-page py-14">
        <ul className="grid gap-5 md:grid-cols-2">
          {CHANNELS.map((c) => (
            <li key={c.title} className="surface-card flex min-w-0 flex-col gap-3 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <c.icon size={19} />
              </span>
              <h2 className="font-display text-lg font-semibold text-content">{c.title}</h2>
              <p className="text-sm leading-relaxed text-content/70">{c.body}</p>
              <a
                href={`mailto:${c.email}`}
                className="mt-auto inline-flex items-center gap-2 pt-2 font-display text-base font-semibold text-brand hover:underline"
              >
                <Mail size={16} /> {c.email}
              </a>
              <p className="text-xs text-content/50">{c.reply}</p>
            </li>
          ))}
        </ul>

        <section className="surface-card mt-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-sm leading-relaxed text-content/75">
            <MessageSquareWarning size={20} className="mt-0.5 shrink-0 text-signal-600" />
            Reporting something urgent about an upcoming meetup — tonight or tomorrow — is faster from the meetup
            page itself: there is a report link right on the listing, and it reaches trust &amp; safety directly.
          </p>
          <Link
            href="/meetups"
            className="link-underline shrink-0 font-semibold text-content"
          >
            Find the meetup
          </Link>
        </section>
      </div>

      <NextUp
        links={[
          { href: '/help', label: 'Help centre', blurb: 'The answer might already be written down.' },
          { href: '/safety', label: 'Trust & safety', blurb: 'What we check, and what happens after a report.' },
          { href: '/press', label: 'Press', blurb: 'Brand assets, figures and past coverage.' },
        ]}
      />
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarClock, IndianRupee, Megaphone, Users } from 'lucide-react';
import { PageHeader, NextUp } from '@/components/site/page-header';
import { ButtonLink } from '@/components/ui/button';
import { CATEGORIES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Partner with us',
  description: 'Run a gym, study space, court or kitchen? CampusClub fills your off-peak hours with paying groups who found you through a meetup.',
};

const BENEFITS = [
  {
    icon: Users,
    title: 'Off-peak hours, filled',
    body: 'A 6am run club, a 2pm study room, a weekday-afternoon court — the hours a venue struggles to sell on its own are exactly the hours a recurring meetup wants.',
  },
  {
    icon: IndianRupee,
    title: 'Paid up front, every time',
    body: 'The host collects the join fee before anyone arrives, so a venue partner is paid for the booking whether or not every seat fills — no chasing a group for money after the fact.',
  },
  {
    icon: Megaphone,
    title: 'Discovery, not just a booking',
    body: 'Every meetup at your venue carries your name and address on a public listing. People who come once for the meetup come back on their own for everything else you offer.',
  },
  {
    icon: CalendarClock,
    title: 'You keep the calendar',
    body: 'You approve which hours are open to hosts. Nothing books against your space without you agreeing to the slot first — CampusClub connects the host to you, it does not manage your calendar.',
  },
];

const FIT = [
  'Gyms and fitness studios with quiet hours between peak sessions',
  'Libraries, co-working spaces and cafés with room for a study table',
  'Sports facilities — badminton, football turf, box cricket — with unsold court time',
  'Restaurants and kitchens that can host a set dinner for six to twelve',
];

export default function PartnersPage() {
  return (
    <>
      <PageHeader
        eyebrow="For venues"
        title="Your quiet hours are somebody else's Tuesday morning."
        lede="Gyms, study spaces, courts and kitchens across every city we run in host CampusClub meetups. A member books the group, pays up front, and brings you a room full of people who did not know your address yesterday."
        actions={
          <ButtonLink href="/contact" size="lg">
            Talk to the partnerships team
          </ButtonLink>
        }
      />

      <div className="container-page py-14">
        <ul className="grid gap-6 md:grid-cols-2">
          {BENEFITS.map((b) => (
            <li key={b.title} className="surface-card flex min-w-0 flex-col gap-3 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <b.icon size={19} />
              </span>
              <h2 className="font-display text-lg font-semibold text-content">{b.title}</h2>
              <p className="text-sm leading-relaxed text-content/75">{b.body}</p>
            </li>
          ))}
        </ul>

        <section className="mt-14" aria-labelledby="fit-heading">
          <h2 id="fit-heading" className="display-md text-content">
            Good fits so far
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {FIT.map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-2xl border border-content/12 bg-canvas-700 p-4 text-sm text-content/75">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-content/55">
            Currently active across {CATEGORIES.length} activities — see the full list on the{' '}
            <Link href="/cities" className="link-underline font-semibold text-content">
              cities page
            </Link>
            .
          </p>
        </section>

        <section className="surface-card mt-14 space-y-3 p-6 sm:p-8" aria-labelledby="how-heading">
          <h2 id="how-heading" className="font-display text-xl font-semibold text-content">
            How it actually starts
          </h2>
          <p className="text-[0.95rem] leading-relaxed text-content/75">
            Most partnerships begin the other way round: a host is already running a meetup at your venue informally,
            using a slot you would have sold at a discount or not at all. We reach out once we see the pattern, or
            you can reach us first — either way, the arrangement is between you and the hosts, and we simply put
            them in front of each other.
          </p>
        </section>
      </div>

      <NextUp
        links={[
          { href: '/host', label: 'Host a meetup', blurb: 'What a member sees when they list a session at your venue.' },
          { href: '/ambassadors', label: 'Campus ambassadors', blurb: 'The people who bring CampusClub to a new city first.' },
          { href: '/contact', label: 'Contact', blurb: 'The right inbox for partnerships.' },
        ]}
      />
    </>
  );
}

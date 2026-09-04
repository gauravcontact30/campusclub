import type { Metadata } from 'next';
import { GraduationCap, HeartHandshake, Megaphone, Sparkles } from 'lucide-react';
import { PageHeader, NextUp } from '@/components/site/page-header';
import { ButtonLink } from '@/components/ui/button';
import { CITIES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Campus ambassadors',
  description: 'Open CampusClub on your campus or in your city. Host the first meetups yourself, get paid for it, and help pick who joins next.',
};

const WHAT_YOU_DO = [
  {
    icon: Sparkles,
    title: 'Host the first meetups yourself',
    body: 'Every city we run in started with one ambassador putting the thing they already did — a study table, a run, a mess-hall dinner — on the board and filling it with people they knew.',
  },
  {
    icon: Megaphone,
    title: 'Put CampusClub in front of your campus',
    body: 'Notice boards, a class WhatsApp group, a five-minute mention before a lecture — whatever actually reaches people where you are. We give you the material; you know your campus better than we do.',
  },
  {
    icon: HeartHandshake,
    title: 'Vet the next ambassador after you',
    body: 'Once your city or campus is running on its own, you help find and brief whoever expands into the next one nearby. Most of our current ambassadors were referred by the one before them.',
  },
];

const PAYS = [
  '₹200 flat for every one of your own hosted meetups that runs with at least four confirmed joins',
  'A share of the join fees on every meetup your referrals host, for their first two months',
  'First access to new activity categories and cities before they go live publicly',
];

export default function AmbassadorsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Campus ambassadors"
        title="Bring CampusClub to a campus that does not have it yet."
        lede="An ambassador is the first host in a city or a college — the person who puts the thing they already do on the board and shows everyone else it is real. We currently run in six cities and it took exactly this to open each one."
        actions={
          <ButtonLink href="/contact" size="lg">
            Apply by email
          </ButtonLink>
        }
      />

      <div className="container-page py-14">
        <ul className="grid gap-6 md:grid-cols-3">
          {WHAT_YOU_DO.map((w) => (
            <li key={w.title} className="surface-card flex min-w-0 flex-col gap-3 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <w.icon size={19} />
              </span>
              <h2 className="font-display text-lg font-semibold text-content">{w.title}</h2>
              <p className="text-sm leading-relaxed text-content/75">{w.body}</p>
            </li>
          ))}
        </ul>

        <section className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="display-md text-content">What it pays</h2>
            <ul className="mt-5 space-y-3">
              {PAYS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-content/75">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="display-md text-content">Who we are looking for</h2>
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-content/12 bg-canvas-700 p-5">
              <GraduationCap size={22} className="mt-0.5 shrink-0 text-brand" />
              <p className="text-[0.95rem] leading-relaxed text-content/75">
                Somebody already running an informal group — a class study circle, a hostel gym crew, a Sunday
                football game — in a city or campus we are not in yet, or only lightly in. You do not need experience
                organising anything formal. You need the group already, and about two hours a week for the first
                month.
              </p>
            </div>
            <p className="mt-4 text-sm text-content/55">
              Currently live in {CITIES.map((c) => c.name).join(', ')}. If your campus is in one of these already, we
              still want to hear from you — most cities run several ambassadors at once, one per neighbourhood.
            </p>
          </div>
        </section>
      </div>

      <NextUp
        links={[
          { href: '/host', label: 'See what hosting looks like', blurb: 'The same form an ambassador uses for their first meetup.' },
          { href: '/cities', label: 'Where we run', blurb: 'Every city and neighbourhood currently active.' },
          { href: '/careers', label: 'Careers', blurb: 'Full-time roles, if ambassador work turns into more.' },
        ]}
      />
    </>
  );
}

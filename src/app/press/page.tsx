import type { Metadata } from 'next';
import { Download, Mail, Newspaper } from 'lucide-react';
import { PageHeader, NextUp } from '@/components/site/page-header';
import { CATEGORIES, CITIES, SITE } from '@/lib/constants';
import { formatCount } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Press',
  description: 'CampusClub in a few sentences and a few numbers, plus how to reach us for an interview or a data request.',
};

const FACTS: [string, string][] = [
  ['Founded', '2024, as a WhatsApp group of nine people in Bengaluru'],
  ['Cities', `${CITIES.length} — ${CITIES.map((c) => c.name).join(', ')}`],
  ['Activities', `${CATEGORIES.length}, from group study to badminton to Sunday dinner`],
  ['Model', 'A per-meetup join fee the host sets and keeps in full — no subscription required to use the product'],
  ['Joins', `${formatCount(41200)}+ paid since launch`],
];

const BOILERPLATE = `${SITE.name} is a pay-per-join board of local meetups. Members list the things they are already doing — a study table, a gym slot, a Sunday dinner — and other members pay that meetup's join fee to take one of its spots. There is no subscription between someone and their first meetup; passes exist only for members going several times a week. ${SITE.name} runs in ${CITIES.length} Indian cities.`;

export default function PressPage() {
  return (
    <>
      <PageHeader
        eyebrow="Press"
        title="CampusClub, from the outside."
        lede="What we are, in a sentence a journalist can use, plus the numbers behind it and how to reach us directly."
        actions={
          <a
            href="mailto:press@campusclub.app"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-on-brand transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Mail size={16} /> press@campusclub.app
          </a>
        }
      />

      <div className="container-page py-14">
        <section aria-labelledby="boilerplate-heading">
          <h2 id="boilerplate-heading" className="eyebrow">
            Boilerplate
          </h2>
          <p className="lede mt-3 max-w-3xl">{BOILERPLATE}</p>
        </section>

        <section className="mt-12" aria-labelledby="facts-heading">
          <h2 id="facts-heading" className="eyebrow">
            In numbers
          </h2>
          <dl className="mt-4 divide-y divide-content/12 border-y border-content/12">
            {FACTS.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="text-sm font-semibold text-content/55">{label}</dt>
                <dd className="text-[0.95rem] text-content/85">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="surface-card mt-12 flex flex-wrap items-center justify-between gap-4 p-6" aria-labelledby="kit-heading">
          <div>
            <h2 id="kit-heading" className="font-display text-lg font-semibold text-content">
              Logo & brand assets
            </h2>
            <p className="mt-1 max-w-md text-sm text-content/65">
              The mark, wordmark, and colour tokens — write to press@campusclub.app and we will send the kit and any
              specific formats you need.
            </p>
          </div>
          <a
            href="mailto:press@campusclub.app?subject=Brand%20kit%20request"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-content/20 px-5 py-3 text-sm font-semibold text-content transition-colors hover:border-content/45"
          >
            <Download size={16} /> Request the kit
          </a>
        </section>

        <section className="mt-12 flex items-start gap-3 text-sm leading-relaxed text-content/60" aria-labelledby="coverage-heading">
          <Newspaper size={18} className="mt-0.5 shrink-0 text-brand" />
          <p id="coverage-heading">
            No press mentions to list yet — we are early. If you are writing about the join-fee model, the trust &
            safety approach, or the six-city expansion, press@campusclub.app is the fastest way to a founder, not a
            comms team.
          </p>
        </section>
      </div>

      <NextUp
        links={[
          { href: '/about', label: 'About CampusClub', blurb: 'The longer version of the story above.' },
          { href: '/stories', label: 'Stories', blurb: 'How the team writes about its own decisions, in public.' },
          { href: '/contact', label: 'Contact', blurb: 'Every inbox, sorted by what you need.' },
        ]}
      />
    </>
  );
}

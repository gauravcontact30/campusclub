import type { Metadata } from 'next';
import { PageHeader, NextUp } from '@/components/site/page-header';
import { ButtonLink } from '@/components/ui/button';
import { FREE_CANCELLATION_HOURS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Help centre',
  description: 'Answers on joining and paying, passes and credits, hosting, and safety — organised, not scattered.',
};

interface Entry {
  q: string;
  a: string;
}

const SECTIONS: { id: string; title: string; entries: Entry[] }[] = [
  {
    id: 'joining',
    title: 'Joining & paying',
    entries: [
      {
        q: 'How does paying actually work?',
        a: 'Every meetup shows a join fee before you commit to anything. Tap join, pay through Razorpay, and you are confirmed immediately — the exact address is released the moment payment clears. There is no membership standing between you and a first meetup.',
      },
      {
        q: 'What does the fee cover?',
        a: 'Whatever the host says it covers, stated on the listing — court hire, a gym day pass, the study room, the food. The whole fee goes to the host; CampusClub takes no cut while the product is finding its shape.',
      },
      {
        q: `Can I get a refund if I cancel?`,
        a: `Yes, automatically, if you cancel more than ${FREE_CANCELLATION_HOURS} hours before the start. Inside that window the fee is not returned, because the host has usually already paid for the venue. Open the meetup under "Your meetups" and cancel from there — no email required.`,
      },
      {
        q: 'The meetup is full. What happens if I join anyway?',
        a: 'You go on a free waitlist. Nothing is charged unless a spot opens up and you take it, and pass holders move to the front of that list first.',
      },
      {
        q: 'A host cancelled on me. What now?',
        a: 'Everyone who joined is refunded in full, automatically, the moment the host cancels — there is no discretion in it and no form to fill in.',
      },
    ],
  },
  {
    id: 'passes',
    title: 'Passes & credits',
    entries: [
      {
        q: 'Do I need a pass to use CampusClub?',
        a: 'No. Pay-as-you-go is the default and the whole product works without ever buying one. A pass just pre-buys joins at a lower price per join, which only pays off if you are going several times a week.',
      },
      {
        q: 'How does a credit work?',
        a: 'One credit covers one join, on any meetup, at any fee. If a meetup costs ₹299 and you have a credit, the credit is spent instead of your card — never both.',
      },
      {
        q: 'Do unused credits roll over?',
        a: 'No, they reset each billing cycle. If you are consistently not using them, a smaller pass or pay-as-you-go usually works out cheaper — the switch takes effect immediately from your passes page.',
      },
      {
        q: 'I cancelled a meetup I used a credit on. Do I get it back?',
        a: `Yes — the same ${FREE_CANCELLATION_HOURS}-hour window that refunds a card payment returns a spent credit to your balance.`,
      },
    ],
  },
  {
    id: 'hosting',
    title: 'Hosting',
    entries: [
      {
        q: 'What does it cost to host?',
        a: 'Nothing. Listing is free, and you keep the entire join fee — CampusClub does not take a commission.',
      },
      {
        q: 'How do I set the right fee?',
        a: 'Cover your real cost and stop there. A fee that reads as profit is the single biggest reason a listing gets browsed and not joined — the board is public, so people compare.',
      },
      {
        q: 'Someone did not turn up after paying. Can I keep the fee?',
        a: 'A no-show does not trigger an automatic refund, but genuine, repeated no-shows are worth reporting — persistent no-show accounts get warned and eventually removed.',
      },
      {
        q: 'How do I cancel a meetup I am hosting?',
        a: 'From "Your meetups," any time. Everyone who joined is refunded in full immediately, and it is removed from the board.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & trust',
    entries: [
      {
        q: 'What does a "verified" host badge mean?',
        a: 'A confirmed phone number, plus a public rating built only from members who actually attended and had a confirmed join. It is not a background check — treat it as one useful signal among several, alongside the rating and the feedback text itself.',
      },
      {
        q: 'Can I see who else is going before I pay?',
        a: 'Yes — first names and how many spots are already taken show on the listing before you commit to anything.',
      },
      {
        q: 'Something happened at a meetup that made me uncomfortable. What do I do?',
        a: 'Report it from the meetup page or write to us at trust@campusclub.app. A person reads every report the same day, and we can act on a specific host or member independent of any public review.',
      },
      {
        q: 'Are women-only meetups a real category?',
        a: 'Yes, in every activity, set by the host at the point of listing — not a filter we apply after the fact.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Your account',
    entries: [
      {
        q: 'How do I change my city or the activities I see first?',
        a: 'Your profile has both. Changing your city does not stop you browsing others — the board always shows every city, just sorted with yours first.',
      },
      {
        q: 'Can I delete my account?',
        a: 'Write to privacy@campusclub.app and we will remove your profile and personal data within 30 days, keeping only what a running transaction legally requires us to retain — see the privacy policy for exactly what and why.',
      },
      {
        q: 'I am not receiving confirmation emails.',
        a: 'Check spam for mail from CampusClub first. If it is genuinely not arriving, write to support@campusclub.app with the email on your account and we will look at it directly.',
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help centre"
        title="Answers, organised rather than scattered."
        lede="Five sections cover almost everything. If yours is not here, the fastest way to a real person is the contact page."
        actions={
          <>
            <ButtonLink href="/contact" size="lg">
              Contact support
            </ButtonLink>
            <ButtonLink href="/safety" variant="outline" size="lg">
              Trust & safety
            </ButtonLink>
          </>
        }
      />

      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[13rem_1fr] lg:gap-14">
          <nav aria-label="Help sections" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <ul className="space-y-1 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block rounded-lg px-3 py-2 text-content/70 transition-colors hover:bg-content/6 hover:text-content"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-14">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="display-md text-content">{section.title}</h2>
                <dl className="mt-6 divide-y divide-content/12 border-y border-content/12">
                  {section.entries.map((entry) => (
                    <div key={entry.q} className="grid gap-2 py-6 md:grid-cols-[0.85fr_1.15fr] md:gap-8">
                      <dt className="font-display text-base font-semibold text-content">{entry.q}</dt>
                      <dd className="text-[0.95rem] leading-relaxed text-content/75">{entry.a}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      </div>

      <NextUp
        links={[
          { href: '/contact', label: 'Contact us', blurb: 'A real person, usually within a working day.' },
          { href: '/safety', label: 'Trust & safety', blurb: 'What we check, and what we do when something goes wrong.' },
          { href: '/legal/refunds', label: 'Refund policy', blurb: 'The full written version of the cancellation rule.' },
        ]}
      />
    </>
  );
}

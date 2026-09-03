import type { Metadata } from 'next';
import { CalendarCheck, CreditCard, HeartHandshake, IndianRupee, MapPinned, RotateCcw, Search, ShieldCheck, Users } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Faq } from '@/components/home/faq';
import { FREE_CANCELLATION_HOURS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'How joining works, what the join fee pays for, what hosts earn, and how VibeClub keeps meetups safe.',
};

const JOINING = [
  {
    icon: Search,
    title: 'Find it',
    body: 'Filter the board by what you want to do, when you are free and how far you will go. Everything listed is inside your city, and most of it is inside your neighbourhood.',
  },
  {
    icon: CreditCard,
    title: 'Pay the join fee',
    body: 'One payment, for one meetup, through Razorpay. The listing shows the exact amount before you commit and says what it covers. No subscription is required.',
  },
  {
    icon: MapPinned,
    title: 'Get the address',
    body: 'The exact street address is released to you the moment you join — never published on the listing, because it is often somebody’s home.',
  },
  {
    icon: CalendarCheck,
    title: 'Turn up, then say how it went',
    body: 'Only people whose join was confirmed and whose meetup has finished can leave feedback. That single rule is why the ratings here are worth reading.',
  },
];

const MONEY = [
  {
    icon: IndianRupee,
    title: 'What the fee pays for',
    body: 'The host’s real costs — court hire, a gym day pass, the study room, the food. Hosts set it themselves, between free and ₹5,000, and the whole amount goes to them.',
  },
  {
    icon: RotateCcw,
    title: 'Cancelling',
    body: `Cancel more than ${FREE_CANCELLATION_HOURS} hours before the start and the fee is refunded automatically, or the pass credit returns to your balance. Inside that window it is not, because the host has usually already paid for the venue. If a host cancels, everyone is refunded in full.`,
  },
  {
    icon: Users,
    title: 'Waitlists',
    body: 'A full meetup still takes your name, at no cost. You are only charged if a spot opens and you take it. Pass holders move up the list first.',
  },
];

const SAFETY = [
  {
    icon: ShieldCheck,
    title: 'Hosts are verified',
    body: 'A verified badge means a confirmed phone number and a public rating built from people who actually attended. A host with no history says so plainly rather than looking established.',
  },
  {
    icon: Users,
    title: 'You see who is coming',
    body: 'First names and how many spots are gone, before you pay. Women-only meetups exist in every category and are set by the host, not by us.',
  },
  {
    icon: HeartHandshake,
    title: 'Report anything',
    body: 'One report gets a human reading it the same day. Hosts and members are both removable, and a removed host’s upcoming meetups are cancelled and refunded in full.',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-content/10 py-16 sm:py-24">
        <div className="container-page max-w-3xl">
          <p className="eyebrow">How it works</p>
          <h1 className="display-lg mt-3 text-balance text-content">
            Pay for the one thing you are going to. Nothing else.
          </h1>
          <p className="lede mt-5">
            VibeClub is a board of things happening near you, run by people who live near you. Every meetup carries a
            join fee its host sets, and that fee is the entire transaction — there is no membership standing between
            you and the first one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/meetups" size="lg">
              See what’s on
            </ButtonLink>
            <ButtonLink href="/host" variant="outline" size="lg">
              Host a meetup
            </ButtonLink>
          </div>
        </div>
      </section>

      <Section id="joining" eyebrow="Joining" title="Four steps, and you only pay at the second one." items={JOINING} ordered />
      <Section id="money" eyebrow="The money" title="Where every rupee goes." items={MONEY} />
      <Section id="hosting" eyebrow="Hosting" title="Free to list, and you keep the fee." items={SAFETY.slice(0, 0)}>
        <div className="grid gap-6 md:grid-cols-2">
          <p className="text-base leading-relaxed text-content/75">
            Listing costs nothing and we take no commission while the product is finding its feet — the join fee goes
            to the host in full. In exchange, hosts carry the parts that make a meetup work: turning up early, starting
            on time, and telling people honestly what the session is.
          </p>
          <p className="text-base leading-relaxed text-content/75">
            We handle the payments, the waitlist, the refunds when somebody drops out, and the reminder the night
            before. A host who cancels refunds everyone automatically — there is no discretion in it, and no way to
            keep the money.
          </p>
        </div>
      </Section>
      <Section id="safety" eyebrow="Trust & safety" title="What we check, and what we do not." items={SAFETY} />

      <Faq />
    </>
  );
}

function Section({
  id,
  eyebrow,
  title,
  items,
  ordered = false,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  items: { icon: typeof Users; title: string; body: string }[];
  ordered?: boolean;
  children?: React.ReactNode;
}) {
  const List = ordered ? 'ol' : 'ul';

  return (
    <section id={id} className="container-page scroll-mt-24 py-16" aria-labelledby={`${id}-heading`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={`${id}-heading`} className="display-md mt-2 max-w-2xl text-balance text-content">
        {title}
      </h2>

      {children}

      {items.length > 0 && (
        <List className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <li key={item.title} className="surface-card space-y-3 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand">
                  <item.icon size={19} />
                </span>
                {ordered && (
                  <span className="font-display text-sm font-bold tabular-nums text-content/35">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                )}
              </div>
              <h3 className="font-display text-base font-bold text-content">{item.title}</h3>
              <p className="text-sm leading-relaxed text-content/70">{item.body}</p>
            </li>
          ))}
        </List>
      )}
    </section>
  );
}

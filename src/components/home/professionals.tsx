import Link from 'next/link';
import { ArrowUpRight, Coffee, Handshake, Laptop, Mountain, Presentation, UserRoundCheck } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { PROFESSIONAL_PORTRAIT_IDS, portraitUrl } from '@/lib/media/portraits';

/**
 * The working half of the board.
 *
 * Students find this product on their own — a study table sells itself. People
 * five years into a job do not, because "meetup" reads to them as either a
 * conference badge or a college club. This section is the argument that it is
 * neither: the same pay-for-the-one-you-go-to board, pointed at the things that
 * actually move a career — a referral, a review of your work, an hour with
 * somebody a rung ahead — plus the weekends that make those people worth
 * knowing.
 *
 * It is laid out as a sticky editorial column against a track grid, which is
 * the same shape as HowItWorks directly above it. Repeating that rhythm is
 * deliberate: two adjacent sections inventing two different layouts is what
 * makes a long landing page feel assembled rather than designed.
 */

const MEMBERS = [
  { name: 'Rahul', role: 'Backend engineer', city: 'Bengaluru' },
  { name: 'Sneha', role: 'Product manager', city: 'Pune' },
  { name: 'Imran', role: 'Data scientist', city: 'Hyderabad' },
  { name: 'Divya', role: 'UX designer', city: 'Mumbai' },
  { name: 'Karthik', role: 'DevOps lead', city: 'Chennai' },
].map((m, i) => ({ ...m, src: portraitUrl(PROFESSIONAL_PORTRAIT_IDS[i], 200) }));

/**
 * Each track is a real filter on the board, not a brochure tile — the link goes
 * somewhere. A card that describes something you then cannot find is worse than
 * no card.
 */
const TRACKS = [
  {
    icon: UserRoundCheck,
    title: 'Referral circles',
    body: 'Eight people, eight companies, one table. You leave knowing who is hiring on which team — and with someone inside willing to put your CV in front of them.',
    tag: 'Networking',
    href: '/meetups?category=networking',
  },
  {
    icon: Laptop,
    title: 'Build nights',
    body: 'Three hours, one room, laptops open. Ship the side project you keep re-planning, with people who will actually read your pull request.',
    tag: 'Skills & hobbies',
    href: '/meetups?category=skills',
  },
  {
    icon: Presentation,
    title: 'Skill swaps',
    body: 'Somebody teaches Kubernetes, somebody teaches negotiation, somebody teaches how to speak at a standup without dying. Everyone is on both sides of it.',
    tag: 'Skills & hobbies',
    href: '/meetups?category=skills',
  },
  {
    icon: Coffee,
    title: 'Career chats',
    body: 'An hour with someone three or four years ahead of you, over coffee that costs less than the advice. No pitch decks, no LinkedIn follow-up request.',
    tag: 'Coffee & hangouts',
    href: '/meetups?category=coffee-chat',
  },
  {
    icon: Handshake,
    title: 'Portfolio & CV reviews',
    body: 'Your work, on a screen, in front of four people who hire for a living. Blunt, specific, and finished inside ninety minutes.',
    tag: 'Networking',
    href: '/meetups?category=networking',
  },
  {
    icon: Mountain,
    title: 'Weekend outings',
    body: 'Treks, cycle loops, Saturday breakfasts. The part that turns a room of job titles into people who will pick up the phone for you.',
    tag: 'Weekend trips',
    href: '/meetups?category=weekend-trips',
  },
];

export function Professionals() {
  return (
    <section
      className="relative overflow-hidden border-y border-content/10 bg-canvas-900/40 py-20"
      aria-labelledby="professionals-heading"
    >
      {/* One soft brand bloom anchored off the top-right corner. It is the only
          decoration in the section, and it is a token gradient rather than an
          image, so it follows the palette and the light/dark switch. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-brand/10 blur-3xl"
      />

      <div className="container-page relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">For professionals &amp; tech folks</p>
          <h2 id="professionals-heading" className="display-lg mt-3 text-balance text-content">
            The people who can refer you are already busy on a Saturday.
          </h2>
          <p className="lede mt-5">
            Engineers, designers, analysts and founders run these themselves — referral circles, build nights, portfolio
            reviews, and the treks in between. Same board, same one-off join fee, no membership and no recruiter in the
            room.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/meetups?category=networking" size="md">
              Browse professional meetups
            </ButtonLink>
            <ButtonLink href="/host" variant="outline" size="md">
              Run one yourself
            </ButtonLink>
          </div>

          {/* Faces before numbers. "2,800 members" is a claim; five people with
              a role and a city under them is closer to evidence. */}
          {/* `shrink-0` is load-bearing: a `-space-x-*` stack measures narrower
              than the pictures it contains, so as a flex child it was being
              squeezed to that phantom width and the last face rode 30px into
              the sentence beside it. `flex-wrap` then keeps the two apart on a
              narrow column rather than crushing the text to three words a line. */}
          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="flex shrink-0 -space-x-3">
              {MEMBERS.map((m) => (
                <ImageWithFallback
                  key={m.name}
                  src={m.src}
                  alt=""
                  seed={m.name}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-canvas"
                />
              ))}
            </span>
            <p className="min-w-[14rem] flex-1 text-sm leading-snug text-content/65">
              <span className="font-semibold text-content">{MEMBERS[0].role}s, {MEMBERS[1].role.toLowerCase()}s,</span>{' '}
              and a few hundred more across {new Set(MEMBERS.map((m) => m.city)).size} cities.
            </p>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {TRACKS.map(({ icon: Icon, title, body, tag, href }) => (
            <li key={title}>
              <Link
                href={href}
                className="surface-card group flex h-full flex-col gap-3 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift"
              >
                <span className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand">
                    <Icon size={18} />
                  </span>
                  <ArrowUpRight
                    size={16}
                    aria-hidden
                    className="text-content/25 transition-colors group-hover:text-brand"
                  />
                </span>

                <h3 className="font-display text-lg font-semibold text-content">{title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-content/70">{body}</p>
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-content/45">{tag}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

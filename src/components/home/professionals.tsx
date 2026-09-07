import Link from 'next/link';
import {
  ArrowUpRight,
  ClipboardList,
  Code2,
  Coffee,
  Compass,
  Mountain,
  Rocket,
  UserRoundCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { PROFESSIONAL_PORTRAIT_IDS, portraitUrl } from '@/lib/media/portraits';
import { tintVars, type Tint } from '@/lib/tints';

const MEMBERS = [
  { name: 'Rahul', role: 'Backend engineer', city: 'Bengaluru' },
  { name: 'Sneha', role: 'Product manager', city: 'Pune' },
  { name: 'Imran', role: 'Data scientist', city: 'Hyderabad' },
  { name: 'Divya', role: 'UX designer', city: 'Mumbai' },
  { name: 'Karthik', role: 'DevOps lead', city: 'Chennai' },
].map((m, i) => ({ ...m, src: portraitUrl(PROFESSIONAL_PORTRAIT_IDS[i], 200) }));

/**
 * Seven reasons a working person actually books an evening, and where each one
 * lands on the board.
 *
 * This was four tiles that all said roughly "meet other professionals", which
 * is not a reason anybody acts on — the reason is always specific: a system
 * design you cannot stop thinking about, a side project that keeps getting
 * re-started, a referral you need before Friday, a ridge you want to be
 * standing on by nine. Naming those is the whole job of this section, and the
 * range of them is the argument that this is not a job board with meetups
 * bolted on.
 *
 * Every `href` is a real query, so the link goes somewhere: a tile that
 * describes something you then cannot find is worse than no tile. `tag` names
 * the board it lands on, in the board's own words, which also means the two
 * tiles that share a destination are not a surprise — "New startup launch" and
 * "Referrals & career feedback" are two reasons to open the same door, and the
 * tag says so before you knock.
 *
 * `meta` is the question the old cards left hanging: how many people, and
 * when. It is the difference between a category and a plan.
 */
const PURPOSES: {
  icon: typeof UserRoundCheck;
  title: string;
  body: string;
  meta: string;
  tag: string;
  href: string;
  tint: Tint;
}[] = [
  {
    icon: Code2,
    title: 'Tech discussion',
    body: 'Bring a problem, a codebase or a strong opinion. Architecture arguments, war stories, and the thing that broke in production on Tuesday.',
    meta: '8–12 people · weekday evenings',
    tag: 'Skills & hobbies',
    href: '/meetups?category=skills',
    tint: 'cyan',
  },
  {
    icon: ClipboardList,
    title: 'New project planning',
    body: 'A table, three hours and somebody to argue the scope down. Leave with a plan instead of starting the same side project again next weekend.',
    meta: '4–8 people · weekend mornings',
    tag: 'Group study',
    href: '/meetups?category=group-study',
    tint: 'indigo',
  },
  {
    icon: Rocket,
    title: 'New startup launch',
    body: 'Founders and first employees comparing notes on the unglamorous half: pricing, incorporation, hiring badly, and the first ten customers.',
    meta: '6–15 people · weekday evenings',
    tag: 'Networking',
    href: '/meetups?category=networking',
    tint: 'rose',
  },
  {
    icon: UserRoundCheck,
    title: 'Referrals & career feedback',
    body: 'Compare notes on teams and hiring, swap referrals, and put your CV or portfolio in front of people at companies you are not inside.',
    meta: '5–10 people · weekends',
    tag: 'Networking',
    href: '/meetups?category=networking',
    tint: 'amber',
  },
  {
    icon: Coffee,
    title: 'Outing & hangout',
    body: 'No agenda beyond the laptop staying shut. Coffee, a long walk, and a table of people who are not on your standup.',
    meta: '4–8 people · any evening',
    tag: 'Coffee & hangouts',
    href: '/meetups?category=coffee-chat',
    tint: 'emerald',
  },
  {
    icon: Mountain,
    title: 'Hill station journey',
    body: 'A bus at five, a ridge by nine, and back before Monday. Costs split, and somebody has already worked out the itinerary.',
    meta: '8–20 people · weekends',
    tag: 'Hiking & treks',
    href: '/meetups?category=hiking-treks',
    tint: 'cyan',
  },
  {
    icon: UtensilsCrossed,
    title: 'Long-table dinners',
    body: 'Six people, one table, and nobody asks what you do for a living in the first hour. The conversations that do not happen at a work dinner.',
    meta: '6 people · Friday and Saturday',
    tag: 'Dinner',
    href: '/meetups?category=dinner',
    tint: 'indigo',
  },
];

/**
 * The whole catalogue is open to a working person, and seven tiles cannot say
 * that. This is the eighth cell of a two-row grid, deliberately not a purpose —
 * dashed, unnumbered, uncoloured — so it reads as the end of the list rather
 * than one more item on it.
 */
function MoreTile() {
  return (
    <Link
      href="/meetups"
      className="group flex h-full flex-col rounded-2xl border border-dashed border-content/25 p-6 transition-colors hover:border-brand hover:bg-brand/5"
    >
      {/* Same vertical rhythm as the numbered tiles beside it — icon, title,
          body, rule, footer — so it sits in the grid rather than floating in
          its own cell. Only the border, the missing number and the absent
          colour mark it as the end of the list. */}
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-content/15 text-content/60 transition-colors group-hover:border-brand group-hover:text-brand">
        <Compass size={21} strokeWidth={1.5} aria-hidden />
      </span>
      <span className="mt-5 block text-sm font-semibold text-content">…and many more</span>
      <span className="mt-2 block flex-1 text-sm leading-relaxed text-content/60">
        Twenty-four kinds of meetup, and not one of them is only for students. Browse the lot.
      </span>
      <span className="mt-9 flex items-center justify-between border-t border-content/10 pt-4 text-xs font-semibold text-content/70 transition-colors group-hover:text-brand">
        The whole board
        <ArrowUpRight size={16} aria-hidden />
      </span>
    </Link>
  );
}

export function Professionals() {
  return (
    <section
      className="border-y border-content/10 bg-canvas-900/30 py-14 sm:py-20"
      aria-labelledby="professionals-heading"
    >
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-7">
          <div className="max-w-2xl">
            <p className="eyebrow">For professionals &amp; tech folks</p>
            <h2 id="professionals-heading" className="section-title mt-3 scroll-mt-28 text-content">
              Referrals happen on Saturdays.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-content/65">
              Engineers, designers, analysts and founders meet here for a reason, and it is rarely
              &ldquo;networking&rdquo;. Pick the reason. Pay that meetup&rsquo;s join fee. Turn up.
            </p>
          </div>
          <ButtonLink href="/meetups?category=networking" variant="outline">
            Browse professional meetups
            <ArrowUpRight size={16} aria-hidden />
          </ButtonLink>
        </div>

        <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PURPOSES.map(({ icon: Icon, title, body, meta, tag, href, tint }, i) => (
            <li key={title}>
              <Link
                href={href}
                style={tintVars(tint)}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[rgb(var(--mark)/0.5)] hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                {/* The tile's colour poured in from the top-left rather than
                    filled flat, so eight tiles in a block read as eight
                    choices and not one striped panel. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(120%_100%_at_0%_0%,rgb(var(--plate))_0%,transparent_72%)]"
                />

                <span className="relative flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--plate))] text-[rgb(var(--mark))] ring-1 ring-inset ring-[rgb(var(--mark)/0.2)] transition-transform duration-300 group-hover:-rotate-6">
                    <Icon size={21} strokeWidth={1.5} aria-hidden />
                  </span>
                  {/* Numbered, because a list of reasons reads as a list when
                      it is counted and as decoration when it is not. */}
                  <span
                    aria-hidden
                    className="font-display text-sm font-bold tabular-nums text-[rgb(var(--mark)/0.45)]"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </span>

                <h3 className="relative mt-5 text-sm font-semibold leading-tight text-content">{title}</h3>
                <p className="relative mt-2 flex-1 text-sm leading-relaxed text-content/65">{body}</p>

                {/* How many, and when — the question the old cards left hanging,
                    and the difference between naming a category and describing
                    a plan somebody can picture themselves at. */}
                <p className="relative mt-4 text-[0.7rem] font-medium leading-none text-[rgb(var(--mark))]">{meta}</p>

                <span className="relative mt-5 flex items-center justify-between gap-3 border-t border-content/10 pt-4 text-xs font-semibold text-content/70 transition-colors group-hover:text-[rgb(var(--mark))]">
                  {tag}
                  <ArrowUpRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}

          <li>
            <MoreTile />
          </li>
        </ul>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-content/10 bg-canvas-700 px-6 py-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex shrink-0 -space-x-2" aria-hidden>
              {MEMBERS.map((m) => (
                <ImageWithFallback
                  key={m.name}
                  src={m.src}
                  alt=""
                  seed={m.name}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-canvas-700"
                />
              ))}
            </span>
            <p className="text-sm leading-relaxed text-content/65">
              <span className="block font-semibold text-content">People first. Job titles second.</span>
              Make space for conversations beyond the workday.
            </p>
          </div>
          <Link href="/host" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand">
            Run one yourself
            <ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

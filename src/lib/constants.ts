import type { Category, City, Level, Pass } from '@/types';

/**
 * The canonical origin, used for `metadataBase`, the sitemap and robots.txt.
 *
 * `??` alone was not enough: a Vercel project with NEXT_PUBLIC_SITE_URL defined
 * but blank hands us an empty string, which is not `undefined`, so the fallback
 * never fired and `new URL('')` threw during the build. Vercel's own
 * VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL are also bare hostnames with no
 * scheme, which `new URL` rejects too. So: take the first candidate that
 * actually parses, adding https:// when a scheme is missing.
 */
function resolveSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      return new URL(withScheme).origin;
    } catch {
      // Malformed value — try the next candidate rather than failing the build.
    }
  }

  return 'http://localhost:3000';
}

export const SITE = {
  name: 'CampusClub',
  tagline: 'Nobody does it alone.',
  description:
    'CampusClub is where people in your city meet up to do the things that are harder alone — group study, exam prep, gym sessions, sport, and long breakfasts. Browse what is happening near you, pay the join fee, turn up.',
  url: resolveSiteUrl(),
};

/* ------------------------------------------------------------------ */
/* What people meet up to do                                           */
/* ------------------------------------------------------------------ */

export const CATEGORIES: Category[] = [
  {
    id: 'c1',
    slug: 'group-study',
    name: 'Group study',
    icon: 'BookOpen',
    verb: 'Study together',
    blurb: 'Three hours, phones face down, one table.',
  },
  {
    id: 'c2',
    slug: 'exam-prep',
    name: 'Exam prep',
    icon: 'GraduationCap',
    verb: 'Prep together',
    blurb: 'Mock tests and doubt-clearing for CAT, GATE, UPSC, NEET.',
  },
  {
    id: 'c3',
    slug: 'dinner',
    name: 'Dinner',
    icon: 'UtensilsCrossed',
    verb: 'Eat together',
    blurb: 'A long table, six people, no phones out.',
  },
  {
    id: 'c4',
    slug: 'breakfast-lunch',
    name: 'Breakfast & lunch',
    icon: 'Croissant',
    verb: 'Eat together',
    blurb: 'Idli runs at seven, thali at one.',
  },
  {
    id: 'c5',
    slug: 'gym',
    name: 'Gym',
    icon: 'Dumbbell',
    verb: 'Train together',
    blurb: 'A spotter, a schedule, and someone who notices you skipped.',
  },
  {
    id: 'c6',
    slug: 'sports',
    name: 'Sports',
    icon: 'Volleyball',
    verb: 'Play together',
    blurb: 'Badminton, football, box cricket — teams made on the spot.',
  },
  {
    id: 'c7',
    slug: 'outdoors',
    name: 'Runs & outdoors',
    icon: 'Footprints',
    verb: 'Move together',
    blurb: 'Sunrise runs, lake loops, weekend treks.',
  },
  {
    id: 'c8',
    slug: 'skills',
    name: 'Skills & hobbies',
    icon: 'Palette',
    verb: 'Practise together',
    blurb: 'Sketching, open mics, chess, language practice.',
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Where                                                               */
/* ------------------------------------------------------------------ */

export const CITIES: City[] = [
  { slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', blurb: 'Library cafés and 6am lake loops.', lat: 12.9716, lng: 77.5946 },
  { slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra', blurb: 'Study rooms above the station, football on reclaimed ground.', lat: 19.076, lng: 72.8777 },
  { slug: 'delhi', name: 'Delhi', state: 'Delhi', blurb: 'UPSC mornings in Rajinder Nagar, badminton by eight.', lat: 28.6139, lng: 77.209 },
  { slug: 'pune', name: 'Pune', state: 'Maharashtra', blurb: 'Student city. Somebody is always revising something.', lat: 18.5204, lng: 73.8567 },
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana', blurb: 'Biryani at one, box cricket at nine.', lat: 17.385, lng: 78.4867 },
  { slug: 'chennai', name: 'Chennai', state: 'Tamil Nadu', blurb: 'Marina runs before the heat arrives.', lat: 13.0827, lng: 80.2707 },
];

export function cityBySlug(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

/** One currency across every city we operate in — no conversion anywhere. */
export const CURRENCY = { code: 'INR', symbol: '₹', locale: 'en-IN' };

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

/**
 * The model: every meetup carries a join fee the host sets, and that is the
 * default way to pay. Passes are simply pre-bought joins at a lower unit
 * price — the checkout spends a credit instead of opening the gateway.
 */
export const PASSES: Pass[] = [
  {
    id: 'payg',
    name: 'Pay as you go',
    priceCents: 0,
    credits: 0,
    cadence: 'no commitment',
    tagline: 'Pay only the join fee, only when you go.',
    perks: ['Browse and save everything', 'Pay per meetup, ₹49 – ₹499', 'Free cancellation up to 6 hours before', 'Host your own meetups for free'],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceCents: 39900,
    credits: 4,
    cadence: 'per month',
    tagline: 'Four joins a month, about a third off.',
    perks: ['4 join credits every month', 'Credits work on any meetup', 'Join full meetups from the waitlist first', 'Cancel anytime'],
  },
  {
    id: 'regular',
    name: 'Regular',
    priceCents: 79900,
    credits: 10,
    cadence: 'per month',
    tagline: 'For people who are out three times a week.',
    perks: ['10 join credits every month', 'Priority on the waitlist', 'Bring a friend once a month', 'Early access to new meetups'],
    highlight: true,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    priceCents: 149900,
    credits: null,
    cadence: 'per month',
    tagline: 'Every meetup in your city, no counting.',
    perks: ['Unlimited joins', 'Top of every waitlist', 'Bring a friend to any meetup', 'Host tools and attendee insights'],
  },
];

export function passById(id: string) {
  return PASSES.find((p) => p.id === id);
}

/** Join fees a host can choose from, in paise. Keeps the form honest. */
export const FEE_PRESETS = [4900, 9900, 14900, 19900, 29900, 49900];

/* ------------------------------------------------------------------ */
/* Meetup vocabulary                                                   */
/* ------------------------------------------------------------------ */

export const LEVELS: { value: Level; label: string; hint: string }[] = [
  { value: 'any', label: 'Everyone', hint: 'No experience assumed.' },
  { value: 'beginner', label: 'Beginner', hint: 'Starting out, and that is the point.' },
  { value: 'intermediate', label: 'Intermediate', hint: 'You have done this a few times.' },
  { value: 'serious', label: 'Serious', hint: 'Turn up ready to work.' },
];

export const AUDIENCES = [
  { value: 'everyone', label: 'Open to everyone' },
  { value: 'women', label: 'Women only' },
  { value: 'men', label: 'Men only' },
] as const;

export const CADENCES = [
  { value: 'once', label: 'One-off' },
  { value: 'weekly', label: 'Every week' },
  { value: 'daily', label: 'Every weekday' },
] as const;

export const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Marathi', 'Tamil', 'Telugu'];

export const BRING_PRESETS = [
  'Laptop',
  'Notebook & pen',
  'Your own mat',
  'Water bottle',
  'Sports shoes',
  'Racket (spares available)',
  'Question bank',
  'Just yourself',
];

export const VOUCH_HIGHLIGHTS = [
  'Started on time',
  'Welcoming to newcomers',
  'Host was organised',
  'Good group energy',
  'Quiet enough to focus',
  'Would join again',
];

export const WHEN_OPTIONS = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'weekend', label: 'This weekend' },
  { value: 'week', label: 'Next 7 days' },
] as const;

export const SORT_OPTIONS = [
  { value: 'soonest', label: 'Starting soonest' },
  { value: 'filling', label: 'Filling fastest' },
  { value: 'cheapest', label: 'Lowest join fee' },
  { value: 'rating', label: 'Best rated hosts' },
  /** Only offered once the visitor has shared their location. */
  { value: 'nearest', label: 'Nearest to me', needsLocation: true },
] as const;

/** How long before a meetup starts a member can still cancel for a refund. */
export const FREE_CANCELLATION_HOURS = 6;

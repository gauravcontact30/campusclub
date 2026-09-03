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
  {
    id: 'c9',
    slug: 'movies-shows',
    name: 'Movies & shows',
    icon: 'Clapperboard',
    verb: 'Watch together',
    blurb: 'One screen, one pick everybody agreed on, popcorn split four ways.',
  },
  {
    id: 'c10',
    slug: 'gaming',
    name: 'Gaming',
    icon: 'Gamepad2',
    verb: 'Play together',
    blurb: 'Couch co-op and LAN nights — bring your own controller.',
  },
  {
    id: 'c11',
    slug: 'board-games',
    name: 'Board games',
    icon: 'Dices',
    verb: 'Play together',
    blurb: 'Catan at nine, Codenames after, nobody keeps score past midnight.',
  },
  {
    id: 'c12',
    slug: 'music-jam',
    name: 'Music & jamming',
    icon: 'Guitar',
    verb: 'Jam together',
    blurb: 'Bring an instrument or just your voice — nobody is auditioning.',
  },
  {
    id: 'c13',
    slug: 'open-mic',
    name: 'Open mic & karaoke',
    icon: 'Mic2',
    verb: 'Perform together',
    blurb: 'Five minutes on stage, or just cheer from the second row.',
  },
  {
    id: 'c14',
    slug: 'book-club',
    name: 'Book club',
    icon: 'Library',
    verb: 'Read together',
    blurb: 'One book a month, opinions stronger than the coffee.',
  },
  {
    id: 'c15',
    slug: 'coffee-chat',
    name: 'Coffee & hangouts',
    icon: 'Coffee',
    verb: 'Talk together',
    blurb: 'No agenda, one table, the good kind of small talk.',
  },
  {
    id: 'c16',
    slug: 'weekend-trips',
    name: 'Weekend trips',
    icon: 'Plane',
    verb: 'Explore together',
    blurb: 'A short trip, split costs, someone else planned the itinerary.',
  },
  {
    id: 'c17',
    slug: 'photography',
    name: 'Photography',
    icon: 'Camera',
    verb: 'Shoot together',
    blurb: 'Golden-hour walks with people who also stop for the light.',
  },
  {
    id: 'c18',
    slug: 'cycling',
    name: 'Cycling',
    icon: 'Bike',
    verb: 'Ride together',
    blurb: 'Sunrise pace lines before the traffic wakes up.',
  },
  {
    id: 'c19',
    slug: 'hiking-treks',
    name: 'Hiking & treks',
    icon: 'Mountain',
    verb: 'Climb together',
    blurb: 'Weekend trails — one person always over-packs the snacks.',
  },
  {
    id: 'c20',
    slug: 'cooking',
    name: 'Cooking & baking',
    icon: 'ChefHat',
    verb: 'Cook together',
    blurb: 'One kitchen, one recipe, dinner is whatever comes out of it.',
  },
  {
    id: 'c21',
    slug: 'arts-crafts',
    name: 'Art & craft',
    icon: 'Brush',
    verb: 'Create together',
    blurb: 'Paint, pottery, whatever is half-finished in your cupboard.',
  },
  {
    id: 'c22',
    slug: 'volunteering',
    name: 'Volunteering',
    icon: 'HeartHandshake',
    verb: 'Give back together',
    blurb: 'A few hours that matter more than another scroll session.',
  },
  {
    id: 'c23',
    slug: 'networking',
    name: 'Networking',
    icon: 'Briefcase',
    verb: 'Connect together',
    blurb: 'Career talk over coffee, no pitch decks required.',
  },
  {
    id: 'c24',
    slug: 'pet-meetups',
    name: 'Pet meetups',
    icon: 'PawPrint',
    verb: 'Walk together',
    blurb: 'Dogs do the introductions so you do not have to.',
  },
];

/**
 * A light "sticker" colour per category card — deliberately independent of
 * the active brand palette. Palette hues stay one colour on purpose (it is
 * what makes `--brand` meaningful everywhere else); a catalogue of 24 very
 * different activities is the one place a rainbow reads as organisation
 * rather than inconsistency. Cycles by index, not by category identity, so
 * adding a 25th category never requires touching this list.
 */
export const CATEGORY_TINTS = [
  'rose',
  'amber',
  'lime',
  'teal',
  'sky',
  'violet',
  'fuchsia',
  'orange',
  'emerald',
  'indigo',
  'cyan',
  'yellow',
] as const;

export function tintForCategory(index: number) {
  return CATEGORY_TINTS[index % CATEGORY_TINTS.length];
}

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
  { slug: 'kolkata', name: 'Kolkata', state: 'West Bengal', blurb: 'Adda over cha, football on the maidan.', lat: 22.5726, lng: 88.3639 },
  { slug: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', blurb: 'Riverfront walks and thali marathons.', lat: 23.0225, lng: 72.5714 },
  { slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan', blurb: 'Old-city walks, chai stalls that never close.', lat: 26.9124, lng: 75.7873 },
  { slug: 'surat', name: 'Surat', state: 'Gujarat', blurb: 'Diamond-city hustle, street food after dark.', lat: 21.1702, lng: 72.8311 },
  { slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', blurb: 'Tehzeeb, kebabs, and evening badminton.', lat: 26.8467, lng: 80.9462 },
  { slug: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh', blurb: 'Industrial grit, gym crews that never skip leg day.', lat: 26.4499, lng: 80.3319 },
  { slug: 'nagpur', name: 'Nagpur', state: 'Maharashtra', blurb: 'Orange-city mornings, tandoori evenings.', lat: 21.1458, lng: 79.0882 },
  { slug: 'indore', name: 'Indore', state: 'Madhya Pradesh', blurb: "India's cleanest streets, its busiest food lanes.", lat: 22.7196, lng: 75.8577 },
  { slug: 'thane', name: 'Thane', state: 'Maharashtra', blurb: 'Lakeside runs a train ride from the city.', lat: 19.2183, lng: 72.9781 },
  { slug: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', blurb: 'Two lakes, one very serious cricket league.', lat: 23.2599, lng: 77.4126 },
  { slug: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', blurb: 'Beach-road sunrises, RK Beach volleyball.', lat: 17.6868, lng: 83.2185 },
  { slug: 'patna', name: 'Patna', state: 'Bihar', blurb: 'Ganga ghats at dawn, exam season all year.', lat: 25.5941, lng: 85.1376 },
  { slug: 'vadodara', name: 'Vadodara', state: 'Gujarat', blurb: 'Garba practice starts long before Navratri.', lat: 22.3072, lng: 73.1812 },
  { slug: 'ghaziabad', name: 'Ghaziabad', state: 'Uttar Pradesh', blurb: "NCR's quieter half, still full of study groups.", lat: 28.6692, lng: 77.4538 },
  { slug: 'ludhiana', name: 'Ludhiana', state: 'Punjab', blurb: 'Industrial city, serious gym culture.', lat: 30.901, lng: 75.8573 },
  { slug: 'agra', name: 'Agra', state: 'Uttar Pradesh', blurb: 'A monument in the background, badminton in the foreground.', lat: 27.1767, lng: 78.0081 },
  { slug: 'nashik', name: 'Nashik', state: 'Maharashtra', blurb: 'Vineyard weekends, temple-town mornings.', lat: 19.9975, lng: 73.7898 },
  { slug: 'faridabad', name: 'Faridabad', state: 'Haryana', blurb: 'NCR satellite city, early gym slots.', lat: 28.4089, lng: 77.3178 },
  { slug: 'rajkot', name: 'Rajkot', state: 'Gujarat', blurb: 'Wide roads, early-morning walkers.', lat: 22.3039, lng: 70.8022 },
  { slug: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', blurb: 'Ghat mornings, chai philosophy till midnight.', lat: 25.3176, lng: 82.9739 },
  { slug: 'srinagar', name: 'Srinagar', state: 'Jammu and Kashmir', blurb: 'Dal Lake mornings, shikara-side study spots.', lat: 34.0837, lng: 74.7973 },
  { slug: 'amritsar', name: 'Amritsar', state: 'Punjab', blurb: 'Langar mornings, kabaddi by evening.', lat: 31.634, lng: 74.8723 },
  { slug: 'navi-mumbai', name: 'Navi Mumbai', state: 'Maharashtra', blurb: 'Planned city, unplanned dinner plans.', lat: 19.033, lng: 73.0297 },
  { slug: 'prayagraj', name: 'Prayagraj', state: 'Uttar Pradesh', blurb: 'Sangam mornings, coaching-class evenings.', lat: 25.4358, lng: 81.8463 },
  { slug: 'ranchi', name: 'Ranchi', state: 'Jharkhand', blurb: 'Waterfalls on the weekend, football every evening.', lat: 23.3441, lng: 85.3096 },
  { slug: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', blurb: 'Fitness city — gyms on every corner.', lat: 11.0168, lng: 76.9558 },
  { slug: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh', blurb: 'Riverside evenings, exam-prep mornings.', lat: 16.5062, lng: 80.648 },
  { slug: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', blurb: 'Blue-city rooftops, sunrise cycling.', lat: 26.2389, lng: 73.0243 },
  { slug: 'madurai', name: 'Madurai', state: 'Tamil Nadu', blurb: 'Temple-town evenings, filter-coffee mornings.', lat: 9.9252, lng: 78.1198 },
  { slug: 'raipur', name: 'Raipur', state: 'Chhattisgarh', blurb: 'Steel-city hustle, weekend cricket.', lat: 21.2514, lng: 81.6296 },
  { slug: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', blurb: 'Planned sectors, serious cycling culture.', lat: 30.7333, lng: 76.7794 },
  { slug: 'mysuru', name: 'Mysuru', state: 'Karnataka', blurb: 'Palace-city mornings, yoga by evening.', lat: 12.2958, lng: 76.6394 },
  { slug: 'guwahati', name: 'Guwahati', state: 'Assam', blurb: 'Brahmaputra sunsets, football every evening.', lat: 26.1445, lng: 91.7362 },
  { slug: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', blurb: 'Hill-station mornings, trek season all year.', lat: 30.3165, lng: 78.0322 },
  { slug: 'thiruvananthapuram', name: 'Thiruvananthapuram', state: 'Kerala', blurb: 'Backwater calm, badminton by the beach.', lat: 8.5241, lng: 76.9366 },
  { slug: 'kochi', name: 'Kochi', state: 'Kerala', blurb: 'Backwaters and book clubs.', lat: 9.9312, lng: 76.2673 },
  { slug: 'noida', name: 'Noida', state: 'Uttar Pradesh', blurb: "NCR's tech corridor, gym before the commute.", lat: 28.5355, lng: 77.391 },
  { slug: 'gurugram', name: 'Gurugram', state: 'Haryana', blurb: 'Cyber-city hustle, rooftop dinners.', lat: 28.4595, lng: 77.0266 },
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

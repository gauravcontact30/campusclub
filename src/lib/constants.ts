import type { Category, City, CityTier, Level, Pass } from '@/types';
import type { Tint } from '@/lib/tints';

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

/**
 * Every activity, and under each one the hobbies people actually name when they
 * describe it.
 *
 * `interests` is not a second taxonomy — nothing routes or filters on it. It is
 * there so a card can show what is inside a heading: "Sports" tells nobody
 * whether their Tuesday badminton is on this site, and "Badminton · Football ·
 * Box cricket" tells them in one glance. Adding one is editorial, and costs
 * nothing but a line here.
 */
export const CATEGORIES: Category[] = [
  {
    id: 'c1',
    slug: 'group-study',
    name: 'Group study',
    icon: 'BookOpen',
    verb: 'Study together',
    blurb: 'Three hours, phones face down, one table.',
    interests: ['Silent study', 'Pomodoro sprints', 'Doubt clearing', 'Assignment days', 'Library sessions'],
  },
  {
    id: 'c2',
    slug: 'exam-prep',
    name: 'Exam prep',
    icon: 'GraduationCap',
    verb: 'Prep together',
    blurb: 'Mock tests and doubt-clearing for CAT, GATE, UPSC, NEET.',
    interests: ['CAT', 'GATE', 'UPSC', 'NEET', 'JEE', 'Mock tests', 'Answer writing'],
  },
  {
    id: 'c3',
    slug: 'dinner',
    name: 'Dinner',
    icon: 'UtensilsCrossed',
    verb: 'Eat together',
    blurb: 'A long table, six people, no phones out.',
    interests: ['Supper clubs', 'Set menus', 'Potlucks', 'Street-food crawls'],
  },
  {
    id: 'c4',
    slug: 'breakfast-lunch',
    name: 'Breakfast & lunch',
    icon: 'Croissant',
    verb: 'Eat together',
    blurb: 'Idli runs at seven, thali at one.',
    interests: ['Idli runs', 'Thali lunches', 'Brunch', 'Chai and bun'],
  },
  {
    id: 'c5',
    slug: 'gym',
    name: 'Gym',
    icon: 'Dumbbell',
    verb: 'Train together',
    blurb: 'A spotter, a schedule, and someone who notices you skipped.',
    interests: ['Strength', 'Powerlifting', 'Calisthenics', 'CrossFit', 'Yoga'],
  },
  {
    id: 'c6',
    slug: 'sports',
    name: 'Sports',
    icon: 'Volleyball',
    verb: 'Play together',
    blurb: 'Badminton, football, box cricket — teams made on the spot.',
    interests: ['Badminton', 'Football', 'Box cricket', 'Volleyball', 'Table tennis'],
  },
  {
    id: 'c7',
    slug: 'outdoors',
    name: 'Runs & outdoors',
    icon: 'Footprints',
    verb: 'Move together',
    blurb: 'Sunrise runs, lake loops, weekend treks.',
    interests: ['5K runs', 'Lake loops', 'Park workouts', 'Sunrise walks'],
  },
  {
    id: 'c8',
    slug: 'skills',
    name: 'Skills & hobbies',
    icon: 'Palette',
    verb: 'Practise together',
    blurb: 'Sketching, open mics, chess, language practice.',
    interests: ['Sketching', 'Chess', 'Language exchange', 'Public speaking', 'Coding'],
  },
  {
    id: 'c9',
    slug: 'movies-shows',
    name: 'Movies & shows',
    icon: 'Clapperboard',
    verb: 'Watch together',
    blurb: 'One screen, one pick everybody agreed on, popcorn split four ways.',
    interests: ['Screenings', 'Film clubs', 'Series marathons', 'Anime nights'],
  },
  {
    id: 'c10',
    slug: 'gaming',
    name: 'Gaming',
    icon: 'Gamepad2',
    verb: 'Play together',
    blurb: 'Couch co-op and LAN nights — bring your own controller.',
    interests: ['Couch co-op', 'LAN nights', 'Esports', 'Retro consoles'],
  },
  {
    id: 'c11',
    slug: 'board-games',
    name: 'Board games',
    icon: 'Dices',
    verb: 'Play together',
    blurb: 'Catan at nine, Codenames after, nobody keeps score past midnight.',
    interests: ['Catan', 'Codenames', 'Carrom', 'Card games', 'D&D'],
  },
  {
    id: 'c12',
    slug: 'music-jam',
    name: 'Music & jamming',
    icon: 'Guitar',
    verb: 'Jam together',
    blurb: 'Bring an instrument or just your voice — nobody is auditioning.',
    interests: ['Guitar circles', 'Vocal jams', 'Percussion', 'Songwriting'],
  },
  {
    id: 'c13',
    slug: 'open-mic',
    name: 'Open mic & karaoke',
    icon: 'Mic2',
    verb: 'Perform together',
    blurb: 'Five minutes on stage, or just cheer from the second row.',
    interests: ['Stand-up', 'Poetry', 'Karaoke', 'Acoustic sets'],
  },
  {
    id: 'c14',
    slug: 'book-club',
    name: 'Book club',
    icon: 'Library',
    verb: 'Read together',
    blurb: 'One book a month, opinions stronger than the coffee.',
    interests: ['Fiction', 'Non-fiction', 'Poetry', 'Regional writing'],
  },
  {
    id: 'c15',
    slug: 'coffee-chat',
    name: 'Coffee & hangouts',
    icon: 'Coffee',
    verb: 'Talk together',
    blurb: 'No agenda, one table, the good kind of small talk.',
    interests: ['Café hangs', 'Walk and talks', 'Newcomer meets'],
  },
  {
    id: 'c16',
    slug: 'weekend-trips',
    name: 'Weekend trips',
    icon: 'Plane',
    verb: 'Explore together',
    blurb: 'A short trip, split costs, someone else planned the itinerary.',
    interests: ['Day trips', 'Camping', 'Road trips', 'Heritage walks'],
  },
  {
    id: 'c17',
    slug: 'photography',
    name: 'Photography',
    icon: 'Camera',
    verb: 'Shoot together',
    blurb: 'Golden-hour walks with people who also stop for the light.',
    interests: ['Street', 'Golden hour', 'Astro', 'Portraits', 'Photo walks'],
  },
  {
    id: 'c18',
    slug: 'cycling',
    name: 'Cycling',
    icon: 'Bike',
    verb: 'Ride together',
    blurb: 'Sunrise pace lines before the traffic wakes up.',
    interests: ['Sunrise rides', 'Long rides', 'MTB', 'Bike commutes'],
  },
  {
    id: 'c19',
    slug: 'hiking-treks',
    name: 'Hiking & treks',
    icon: 'Mountain',
    verb: 'Climb together',
    blurb: 'Weekend trails — one person always over-packs the snacks.',
    interests: ['Day hikes', 'Night treks', 'Waterfall trails', 'Hill climbs'],
  },
  {
    id: 'c20',
    slug: 'cooking',
    name: 'Cooking & baking',
    icon: 'ChefHat',
    verb: 'Cook together',
    blurb: 'One kitchen, one recipe, dinner is whatever comes out of it.',
    interests: ['Baking', 'Regional cuisine', 'Barbecue', 'Meal prep'],
  },
  {
    id: 'c21',
    slug: 'arts-crafts',
    name: 'Art & craft',
    icon: 'Brush',
    verb: 'Create together',
    blurb: 'Paint, pottery, whatever is half-finished in your cupboard.',
    interests: ['Painting', 'Pottery', 'Origami', 'Journalling'],
  },
  {
    id: 'c22',
    slug: 'volunteering',
    name: 'Volunteering',
    icon: 'HeartHandshake',
    verb: 'Give back together',
    blurb: 'A few hours that matter more than another scroll session.',
    interests: ['Lake cleanups', 'Teaching', 'Animal shelters', 'Food drives'],
  },
  {
    id: 'c23',
    slug: 'networking',
    name: 'Networking',
    icon: 'Briefcase',
    verb: 'Connect together',
    blurb: 'Career talk over coffee, no pitch decks required.',
    interests: ['Founder coffee', 'Career switch', 'Portfolio reviews', 'Industry meets'],
  },
  {
    id: 'c24',
    slug: 'pet-meetups',
    name: 'Pet meetups',
    icon: 'PawPrint',
    verb: 'Walk together',
    blurb: 'Dogs do the introductions so you do not have to.',
    interests: ['Dog walks', 'Puppy socials', 'Adoption drives', 'Cat cafés'],
  },
];

/**
 * Five shelves for twenty-four activities.
 *
 * A flat catalogue is a wall, not an index: twenty-four tiles all shout at the
 * same volume, and nothing tells somebody arriving for the first time where to
 * start looking. Shelving them gives the landing page a shape to scan, and it
 * lets one colour stand for a whole shelf instead of twenty-four unrelated
 * hues — colour that encodes the grouping rather than decorating the tiles.
 *
 * `tint` names a theme-aware token pair in globals.css (`--tint-<name>` for
 * the pale plate, `--tint-<name>-ink` for the mark on it), so the accents
 * repaint with light and dark instead of being fixed hex. Adjacent shelves
 * never share a hue family.
 */
export interface CategoryGroup {
  id: string;
  name: string;
  tint: Tint;
  slugs: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'study',
    name: 'Study & work',
    tint: 'indigo',
    slugs: ['group-study', 'exam-prep', 'book-club', 'networking'],
  },
  {
    id: 'food',
    name: 'Food & drink',
    tint: 'amber',
    slugs: ['dinner', 'breakfast-lunch', 'coffee-chat', 'cooking'],
  },
  {
    id: 'fitness',
    name: 'Fitness & outdoors',
    tint: 'emerald',
    slugs: ['gym', 'sports', 'outdoors', 'cycling', 'hiking-treks', 'pet-meetups'],
  },
  {
    id: 'nights',
    name: 'Games & nights out',
    tint: 'rose',
    slugs: ['movies-shows', 'gaming', 'board-games', 'music-jam', 'open-mic'],
  },
  {
    id: 'make',
    name: 'Make & explore',
    tint: 'cyan',
    slugs: ['skills', 'arts-crafts', 'photography', 'weekend-trips', 'volunteering'],
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

/**
 * The categories on one shelf, in the order the shelf lists them.
 *
 * A slug that no longer exists is dropped rather than rendered as a blank
 * link; `constants.test.ts` is what catches the typo, not the page.
 */
export function categoriesInGroup(group: CategoryGroup): Category[] {
  return group.slugs
    .map((slug) => categoryBySlug(slug))
    .filter((c): c is Category => Boolean(c));
}

/* ------------------------------------------------------------------ */
/* Where                                                               */
/* ------------------------------------------------------------------ */

/**
 * Where CampusClub runs.
 *
 * Eight metros, twenty-eight Tier-2 cities, and two district towns in Uttar
 * Pradesh — `tier` says which is which, and every count on the site is drawn
 * from that field rather than written into a sentence.
 *
 * The list was 119 cities once, which was a claim the product could not keep,
 * and then ten, which was that correction over-applied. A board is only worth
 * opening where enough people are already going to things that a stranger's
 * meetup fills — and that was never a metro-only fact. It is just as true of
 * Sarafa after dark in Indore, the coaching quarters of Lucknow and Patna, the
 * mill-and-IT belt in Coimbatore, and every campus town on this list. Tier-2 is
 * where the product has to work on its own merits instead of riding metro
 * density, which is why it is the middle of the catalogue and not a footnote.
 *
 * Mainpuri and Etawah stay at the bottom for the reason they were once the only
 * two non-metros: small enough that a board there proves the model is not a
 * city trick.
 *
 * Opening a city is adding a line here — plus a photograph
 * (`scripts/city-photos.mjs`) and a guide entry (`lib/data/city-guide.ts`).
 */
export const CITIES: City[] = [
  /* ------------------------------- Metros -------------------------------- */
  { slug: 'delhi', name: 'Delhi', state: 'Delhi', tier: 1, blurb: 'UPSC mornings in Rajinder Nagar, badminton by eight.', lat: 28.6139, lng: 77.209 },
  { slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra', tier: 1, blurb: 'Study rooms above the station, football on reclaimed ground.', lat: 19.076, lng: 72.8777 },
  { slug: 'kolkata', name: 'Kolkata', state: 'West Bengal', tier: 1, blurb: 'Adda over cha, football on the maidan.', lat: 22.5726, lng: 88.3639 },
  { slug: 'chennai', name: 'Chennai', state: 'Tamil Nadu', tier: 1, blurb: 'Marina runs before the heat arrives.', lat: 13.0827, lng: 80.2707 },
  { slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', tier: 1, blurb: 'Library cafés and 6am lake loops.', lat: 12.9716, lng: 77.5946 },
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana', tier: 1, blurb: 'Biryani at one, box cricket at nine.', lat: 17.385, lng: 78.4867 },
  { slug: 'pune', name: 'Pune', state: 'Maharashtra', tier: 1, blurb: 'Student city. Somebody is always revising something.', lat: 18.5204, lng: 73.8567 },
  { slug: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', tier: 1, blurb: 'Riverfront walks and thali marathons.', lat: 23.0225, lng: 72.5714 },

  /* ------------------------------- Tier-2 -------------------------------- */
  { slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan', tier: 2, blurb: 'Nahargarh before sunrise, kachori at the old-city gates after.', lat: 26.9124, lng: 75.7873 },
  { slug: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', tier: 2, blurb: 'Fort-wall walks at dawn, mirchi vada by nine.', lat: 26.2389, lng: 73.0243 },
  { slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', tier: 2, blurb: 'Coaching-hall evenings, and a dinner that takes three hours.', lat: 26.8467, lng: 80.9462 },
  { slug: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh', tier: 2, blurb: 'Engineering-town study rooms, barrage rides on Sunday.', lat: 26.4499, lng: 80.3319 },
  { slug: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', tier: 2, blurb: 'The ghats at five, and nobody is in a hurry afterwards.', lat: 25.3176, lng: 82.9739 },
  { slug: 'agra', name: 'Agra', state: 'Uttar Pradesh', tier: 2, blurb: 'Sunrise at the river bend, petha on the walk back.', lat: 27.1767, lng: 78.0081 },
  { slug: 'nagpur', name: 'Nagpur', state: 'Maharashtra', tier: 2, blurb: 'Dead centre of the country, and badminton courts to match.', lat: 21.1458, lng: 79.0882 },
  { slug: 'nashik', name: 'Nashik', state: 'Maharashtra', tier: 2, blurb: 'Vineyard rides on Saturday, Godavari steps on Sunday.', lat: 19.9975, lng: 73.7898 },
  { slug: 'indore', name: 'Indore', state: 'Madhya Pradesh', tier: 2, blurb: 'Sarafa does not close, so nor does anything else.', lat: 22.7196, lng: 75.8577 },
  { slug: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', tier: 2, blurb: 'Two lakes, one long loop, chai at either end.', lat: 23.2599, lng: 77.4126 },
  { slug: 'patna', name: 'Patna', state: 'Bihar', tier: 2, blurb: 'BPSC and UPSC mornings; the ghats are the reward.', lat: 25.5941, lng: 85.1376 },
  { slug: 'surat', name: 'Surat', state: 'Gujarat', tier: 2, blurb: 'Trade hours, so the gym fills at ten at night.', lat: 21.1702, lng: 72.8311 },
  { slug: 'vadodara', name: 'Vadodara', state: 'Gujarat', tier: 2, blurb: 'A university town that garbas nine nights straight.', lat: 22.3072, lng: 73.1812 },
  { slug: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', tier: 2, blurb: 'Mill town turned tech town, with hills on every ride out.', lat: 11.0168, lng: 76.9558 },
  { slug: 'madurai', name: 'Madurai', state: 'Tamil Nadu', tier: 2, blurb: 'Eats at midnight, runs at five, argues in between.', lat: 9.9252, lng: 78.1198 },
  { slug: 'kochi', name: 'Kochi', state: 'Kerala', tier: 2, blurb: 'Backwater runs, Fort Kochi evenings, coffee that lasts.', lat: 9.9312, lng: 76.2673 },
  { slug: 'thiruvananthapuram', name: 'Thiruvananthapuram', state: 'Kerala', tier: 2, blurb: 'Beach loops at Shanghumugham, tech park by nine.', lat: 8.5241, lng: 76.9366 },
  { slug: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', tier: 2, blurb: 'Beach Road at dawn — a cycling city almost by accident.', lat: 17.6868, lng: 83.2185 },
  { slug: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh', tier: 2, blurb: 'Barrage walks, and study tables that start at four.', lat: 16.5062, lng: 80.648 },
  { slug: 'mysuru', name: 'Mysuru', state: 'Karnataka', tier: 2, blurb: 'Yoga at six, Chamundi steps after, palace-lit weekends.', lat: 12.2958, lng: 76.6394 },
  { slug: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', tier: 2, blurb: 'Sukhna at sunrise, and a grid you can cycle end to end.', lat: 30.7333, lng: 76.7794 },
  { slug: 'ludhiana', name: 'Ludhiana', state: 'Punjab', tier: 2, blurb: 'Factory hours, and a gym culture that matches them.', lat: 30.901, lng: 75.8573 },
  { slug: 'amritsar', name: 'Amritsar', state: 'Punjab', tier: 2, blurb: 'Langar at any hour, and the wall walk before it.', lat: 31.634, lng: 74.8723 },
  { slug: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', tier: 2, blurb: 'A temple city with a student belt bolted onto it.', lat: 20.2961, lng: 85.8245 },
  { slug: 'guwahati', name: 'Guwahati', state: 'Assam', tier: 2, blurb: 'Brahmaputra-side runs, hill climbs at the weekend.', lat: 26.1445, lng: 91.7362 },
  { slug: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', tier: 2, blurb: 'Valley town — the trailhead is twenty minutes away.', lat: 30.3165, lng: 78.0322 },
  { slug: 'raipur', name: 'Raipur', state: 'Chhattisgarh', tier: 2, blurb: 'New-capital grid, and cricket on every spare ground.', lat: 21.2514, lng: 81.6296 },
  { slug: 'ranchi', name: 'Ranchi', state: 'Jharkhand', tier: 2, blurb: 'Plateau air, waterfalls in monsoon, hockey all year.', lat: 23.3441, lng: 85.3096 },

  /* --------------------------- District towns ---------------------------- */
  { slug: 'mainpuri', name: 'Mainpuri', state: 'Uttar Pradesh', tier: 3, blurb: 'District town — the study room is above the market.', lat: 27.235, lng: 79.027 },
  { slug: 'etawah', name: 'Etawah', state: 'Uttar Pradesh', tier: 3, blurb: 'Yamuna-ravine town with a serious cycling crowd.', lat: 26.7855, lng: 79.015 },
];

/**
 * What each tier means, in the words the site uses for it.
 *
 * Held here rather than written out per page because six pages count these
 * cities, and every one of them was rounding the claim its own way: the landing
 * page still said "eight metros and two towns" long after neither number was
 * the whole story. A tier is a filter on /cities, a badge on a card and a dot
 * size on the coverage map, and all three read from this.
 */
export interface CityTierInfo {
  tier: CityTier;
  /** Chip and badge text. Short enough to sit on a photograph. */
  label: string;
  /** The plural for counting: "28 Tier-2 cities". */
  noun: string;
  blurb: string;
}

export const CITY_TIERS: CityTierInfo[] = [
  {
    tier: 1,
    label: 'Metros',
    noun: 'metros',
    blurb: 'Enough is already happening that a stranger’s meetup fills the day it is posted.',
  },
  {
    tier: 2,
    label: 'Tier-2',
    noun: 'Tier-2 cities',
    blurb: 'Student belts, coaching quarters and IT parks. The demand is there; nobody has gathered it.',
  },
  {
    tier: 3,
    label: 'Towns',
    noun: 'district towns',
    blurb: 'Small enough that a board has to earn every join — which is the point of having them.',
  },
];

export function cityBySlug(slug: string) {
  return CITIES.find((c) => c.slug === slug);
}

/** Every city on one tier, in catalogue order. */
export function citiesInTier(tier: CityTier) {
  return CITIES.filter((c) => c.tier === tier);
}

/** What a tier is called. Never undefined — `CityTier` is the three defined above. */
export function tierInfo(tier: CityTier): CityTierInfo {
  return CITY_TIERS.find((t) => t.tier === tier) ?? CITY_TIERS[0];
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

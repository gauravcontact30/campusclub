import type { Category, SubscriptionPlan } from '@/types';

export const SITE = {
  name: 'SitNext',
  tagline: 'Find the good stuff. Meet the good people.',
  description:
    'SitNext is a local discovery platform: read and write honest reviews of neighbourhood businesses, then book a seat at a curated dinner with five strangers who share your taste.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};

export const CATEGORIES: Category[] = [
  { id: 'c1', slug: 'restaurants', name: 'Restaurants', icon: 'UtensilsCrossed', blurb: 'Tables worth booking twice.' },
  { id: 'c2', slug: 'cafes', name: 'Coffee & Cafés', icon: 'Coffee', blurb: 'Where the laptops and the lingerers go.' },
  { id: 'c3', slug: 'bars', name: 'Bars & Nightlife', icon: 'Martini', blurb: 'Last orders, first impressions.' },
  { id: 'c4', slug: 'home-services', name: 'Home Services', icon: 'Wrench', blurb: 'Plumbers, painters, people who show up.' },
  { id: 'c5', slug: 'beauty-spa', name: 'Beauty & Spa', icon: 'Scissors', blurb: 'Cuts, colour and quiet rooms.' },
  { id: 'c6', slug: 'fitness', name: 'Fitness', icon: 'Dumbbell', blurb: 'Studios that keep you coming back.' },
  { id: 'c7', slug: 'shopping', name: 'Shopping', icon: 'ShoppingBag', blurb: 'Independents worth the detour.' },
  { id: 'c8', slug: 'health', name: 'Health & Medical', icon: 'Stethoscope', blurb: 'Clinics with a human touch.' },
];

export const CITIES = [
  { slug: 'bengaluru', name: 'Bengaluru', country: 'India', blurb: 'Filter coffee to natural wine, in one street.' },
  { slug: 'mumbai', name: 'Mumbai', country: 'India', blurb: 'A city that eats standing up.' },
  { slug: 'delhi', name: 'Delhi', country: 'India', blurb: 'Old kitchens, new counters.' },
  { slug: 'london', name: 'London', country: 'United Kingdom', blurb: 'Six strangers, one long table.' },
  { slug: 'new-york', name: 'New York', country: 'United States', blurb: 'Reservations are a personality here.' },
  { slug: 'lisbon', name: 'Lisbon', country: 'Portugal', blurb: 'Dinner starts when the light goes.' },
];

/** Price tiers are rendered in the currency of the city the listing sits in. */
export const CITY_CURRENCY: Record<string, { code: string; symbol: string; locale: string }> = {
  Bengaluru: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  Mumbai: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  Delhi: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  London: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  'New York': { code: 'USD', symbol: '$', locale: 'en-US' },
  Lisbon: { code: 'EUR', symbol: '€', locale: 'pt-PT' },
};

export const DEFAULT_CURRENCY = CITY_CURRENCY.Bengaluru;

export const PRICE_LABELS: Record<number, string> = { 1: '₹', 2: '₹₹', 3: '₹₹₹', 4: '₹₹₹₹' };

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const AMENITIES = [
  'Outdoor seating',
  'Wheelchair accessible',
  'Accepts cards',
  'Free Wi-Fi',
  'Pet friendly',
  'Parking',
  'Vegan options',
  'Late night',
  'Family friendly',
  'Reservations',
];

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Explorer',
    priceCents: 0,
    cadence: 'forever',
    tagline: 'Discover, review, save. No card needed.',
    perks: ['Unlimited search & reviews', 'Save places to lists', 'One dinner per quarter', 'Community guidelines badge'],
  },
  {
    id: 'monthly',
    name: 'Monthly Table',
    priceCents: 129900,
    cadence: 'per month',
    tagline: 'A dinner every week, matched to you.',
    perks: ['4 dinners a month', 'Priority matching', 'Venue reveal 24h early', 'Cancel anytime'],
    highlight: true,
  },
  {
    id: 'quarterly',
    name: 'Season Pass',
    priceCents: 329900,
    cadence: 'per quarter',
    tagline: 'Three months of Wednesdays.',
    perks: ['12 dinners', 'Priority matching', 'Bring-a-friend pass ×1', 'Partner venue discounts'],
  },
  {
    id: 'annual',
    name: 'Regulars Club',
    priceCents: 1099900,
    cadence: 'per year',
    tagline: 'For people who never sit at home.',
    perks: ['Unlimited dinners', 'Concierge matching', 'Bring-a-friend pass ×4', 'Early access to new cities'],
  },
];

export const QUIZ_QUESTIONS = [
  {
    id: 'energy',
    prompt: 'At a table of six, you are usually…',
    help: 'There is no wrong answer — we balance every table.',
    options: [
      { value: 'listener', label: 'The listener', hint: 'You ask the second question.' },
      { value: 'spark', label: 'The spark', hint: 'Silence lasts about four seconds.' },
      { value: 'anchor', label: 'The anchor', hint: 'You keep the night on the rails.' },
      { value: 'wildcard', label: 'The wildcard', hint: 'Nobody predicts your stories.' },
    ],
  },
  {
    id: 'topics',
    prompt: 'The conversation you would happily lose two hours to?',
    help: 'We seat people with overlapping curiosity, not identical opinions.',
    options: [
      { value: 'culture', label: 'Books, film & music' },
      { value: 'work', label: 'Work, startups & craft' },
      { value: 'world', label: 'Travel, cities & politics' },
      { value: 'life', label: 'Relationships & the big questions' },
    ],
  },
  {
    id: 'food',
    prompt: 'Your ideal plate on a Wednesday night?',
    help: 'Dietary needs are collected at booking — this is about taste.',
    options: [
      { value: 'comfort', label: 'Comfort food, generous portions' },
      { value: 'adventurous', label: 'Something I cannot pronounce' },
      { value: 'plant', label: 'Plant-forward and bright' },
      { value: 'classic', label: 'A well-made classic' },
    ],
  },
  {
    id: 'pace',
    prompt: 'How does the night end?',
    help: 'Half of our tables move on to a second venue.',
    options: [
      { value: 'early', label: 'Home by ten, happily' },
      { value: 'second', label: 'One more drink somewhere' },
      { value: 'late', label: 'Last train, obviously' },
      { value: 'flow', label: 'Whatever the table decides' },
    ],
  },
  {
    id: 'age',
    prompt: 'Which age range should we seat you closest to?',
    help: 'Tables mix ranges, but we keep everyone within a comfortable spread.',
    options: [
      { value: '20s', label: '21 – 29' },
      { value: '30s', label: '30 – 39' },
      { value: '40s', label: '40 – 49' },
      { value: 'any', label: 'Surprise me' },
    ],
  },
  {
    id: 'language',
    prompt: 'Which language should the table run in?',
    help: 'We match on the language you are most comfortable joking in.',
    options: [
      { value: 'english', label: 'English' },
      { value: 'hindi', label: 'Hindi' },
      { value: 'portuguese', label: 'Portuguese' },
      { value: 'any', label: 'Any of the above' },
    ],
  },
];

export const OWNER_ROLES = ['Owner', 'Manager', 'Marketing', 'Franchisee', 'Other'];

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  /** Only offered once the visitor has shared their location. */
  { value: 'distance', label: 'Nearest first', needsLocation: true },
] as const;

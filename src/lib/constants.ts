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

  /* ---------------------------------------------------------------- tier 2 --
     Where most of the country actually studies and trains. The board is
     thinner here by design — a city opens when enough people ask — but a
     district town with one 6am study table is exactly the case this product
     is for, and it cannot be searched for if it is not listed. */
  { slug: 'meerut', name: 'Meerut', state: 'Uttar Pradesh', blurb: 'Sports-goods city — someone is always testing a new racket.', lat: 28.9845, lng: 77.7064 },
  { slug: 'bareilly', name: 'Bareilly', state: 'Uttar Pradesh', blurb: 'Jhumka city. Morning walks at the Botanical Garden.', lat: 28.367, lng: 79.4304 },
  { slug: 'aligarh', name: 'Aligarh', state: 'Uttar Pradesh', blurb: 'University town — the library never really empties.', lat: 27.8974, lng: 78.088 },
  { slug: 'moradabad', name: 'Moradabad', state: 'Uttar Pradesh', blurb: 'Brass-city workshops, cricket on any flat ground.', lat: 28.8386, lng: 78.7733 },
  { slug: 'gorakhpur', name: 'Gorakhpur', state: 'Uttar Pradesh', blurb: 'Railway-junction town, Ramgarh Tal loops at dawn.', lat: 26.7606, lng: 83.3732 },
  { slug: 'jhansi', name: 'Jhansi', state: 'Uttar Pradesh', blurb: 'Fort walks and exam prep in equal measure.', lat: 25.4484, lng: 78.5685 },
  { slug: 'jabalpur', name: 'Jabalpur', state: 'Madhya Pradesh', blurb: 'Marble-rocks weekends, defence-exam mornings.', lat: 23.1815, lng: 79.9864 },
  { slug: 'gwalior', name: 'Gwalior', state: 'Madhya Pradesh', blurb: 'Fort on the hill, music in the evening.', lat: 26.2183, lng: 78.1828 },
  { slug: 'ujjain', name: 'Ujjain', state: 'Madhya Pradesh', blurb: 'Temple-town mornings, Shipra-ghat runs.', lat: 23.1793, lng: 75.7849 },
  { slug: 'kota', name: 'Kota', state: 'Rajasthan', blurb: 'Coaching capital. Study groups outnumber everything else.', lat: 25.2138, lng: 75.8648 },
  { slug: 'ajmer', name: 'Ajmer', state: 'Rajasthan', blurb: 'Ana Sagar walks, hill treks on Sunday.', lat: 26.4499, lng: 74.6399 },
  { slug: 'udaipur', name: 'Udaipur', state: 'Rajasthan', blurb: 'Lake city — sunrise runs are the point.', lat: 24.5854, lng: 73.7125 },
  { slug: 'jalandhar', name: 'Jalandhar', state: 'Punjab', blurb: 'Sports-manufacturing town, hockey in the blood.', lat: 31.326, lng: 75.5762 },
  { slug: 'patiala', name: 'Patiala', state: 'Punjab', blurb: 'University city, akhara mornings, long dinners.', lat: 30.3398, lng: 76.3869 },
  { slug: 'bathinda', name: 'Bathinda', state: 'Punjab', blurb: 'Cantonment calm and early gym crews.', lat: 30.211, lng: 74.9455 },
  { slug: 'hisar', name: 'Hisar', state: 'Haryana', blurb: 'Agricultural-university town, wrestling pits and 5am runs.', lat: 29.1492, lng: 75.7217 },
  { slug: 'rohtak', name: 'Rohtak', state: 'Haryana', blurb: 'Wrestling country. The gym opens before the sun.', lat: 28.8955, lng: 76.6066 },
  { slug: 'karnal', name: 'Karnal', state: 'Haryana', blurb: 'Grand Trunk Road town, cycling on the bypass.', lat: 29.6857, lng: 76.9905 },
  { slug: 'muzaffarpur', name: 'Muzaffarpur', state: 'Bihar', blurb: 'Litchi country, competitive-exam mornings.', lat: 26.1197, lng: 85.3910 },
  { slug: 'bhagalpur', name: 'Bhagalpur', state: 'Bihar', blurb: 'Silk city on the Ganga, ghat walks at dawn.', lat: 25.2425, lng: 86.9842 },
  { slug: 'darbhanga', name: 'Darbhanga', state: 'Bihar', blurb: 'Pond-and-palace town, cricket on every maidan.', lat: 26.1542, lng: 85.8918 },
  { slug: 'siliguri', name: 'Siliguri', state: 'West Bengal', blurb: 'Gateway to the hills — trek groups leave on Fridays.', lat: 26.7271, lng: 88.3953 },
  { slug: 'durgapur', name: 'Durgapur', state: 'West Bengal', blurb: 'Steel-town engineering crowd, football all season.', lat: 23.5204, lng: 87.3119 },
  { slug: 'rourkela', name: 'Rourkela', state: 'Odisha', blurb: 'Hockey nursery. Turf is booked by six.', lat: 22.2604, lng: 84.8536 },
  { slug: 'berhampur', name: 'Berhampur', state: 'Odisha', blurb: 'Silk-city evenings, beach runs at Gopalpur.', lat: 19.3149, lng: 84.7941 },
  { slug: 'bilaspur', name: 'Bilaspur', state: 'Chhattisgarh', blurb: 'Railway-zone town, badminton halls that stay open late.', lat: 22.0797, lng: 82.1409 },
  { slug: 'nanded', name: 'Nanded', state: 'Maharashtra', blurb: 'Gurdwara town on the Godavari, long morning walks.', lat: 19.1383, lng: 77.3210 },
  { slug: 'kolhapur', name: 'Kolhapur', state: 'Maharashtra', blurb: 'Wrestling akhadas and the best possible misal break.', lat: 16.705, lng: 74.2433 },
  { slug: 'solapur', name: 'Solapur', state: 'Maharashtra', blurb: 'Textile town, cricket on the ground behind the mill.', lat: 17.6599, lng: 75.9064 },
  { slug: 'hubballi', name: 'Hubballi', state: 'Karnataka', blurb: 'North-Karnataka hub, cycling out to Unkal Lake.', lat: 15.3647, lng: 75.124 },
  { slug: 'belagavi', name: 'Belagavi', state: 'Karnataka', blurb: 'Border city, football culture, monsoon treks.', lat: 15.8497, lng: 74.4977 },
  { slug: 'tiruchirappalli', name: 'Tiruchirappalli', state: 'Tamil Nadu', blurb: 'Rock-fort mornings and serious exam study.', lat: 10.7905, lng: 78.7047 },
  { slug: 'salem', name: 'Salem', state: 'Tamil Nadu', blurb: 'Steel-town hills, Yercaud runs on the weekend.', lat: 11.6643, lng: 78.146 },
  { slug: 'tirunelveli', name: 'Tirunelveli', state: 'Tamil Nadu', blurb: 'Halwa town, temple-tank walks before the heat.', lat: 8.7139, lng: 77.7567 },
  { slug: 'warangal', name: 'Warangal', state: 'Telangana', blurb: 'Kakatiya-fort city with a big student crowd.', lat: 17.9689, lng: 79.5941 },
  { slug: 'karimnagar', name: 'Karimnagar', state: 'Telangana', blurb: 'Granite country, Manair-river walks at dusk.', lat: 18.4386, lng: 79.1288 },
  { slug: 'kakinada', name: 'Kakinada', state: 'Andhra Pradesh', blurb: 'Port town, beach-road cycling, kaja after.', lat: 16.9891, lng: 82.2475 },
  { slug: 'tirupati', name: 'Tirupati', state: 'Andhra Pradesh', blurb: 'Temple-hill climbs count as a workout, ask anyone.', lat: 13.6288, lng: 79.4192 },
  { slug: 'kozhikode', name: 'Kozhikode', state: 'Kerala', blurb: 'Beach city — football on the sand, halwa afterwards.', lat: 11.2588, lng: 75.7804 },
  { slug: 'thrissur', name: 'Thrissur', state: 'Kerala', blurb: 'Cultural capital, round walks, percussion practice.', lat: 10.5276, lng: 76.2144 },
  { slug: 'jamshedpur', name: 'Jamshedpur', state: 'Jharkhand', blurb: 'Planned steel city with more sports grounds than most.', lat: 22.8046, lng: 86.2029 },
  { slug: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', blurb: 'Temple city turned tech city, hockey on the turf.', lat: 20.2961, lng: 85.8245 },
  { slug: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', blurb: 'The Ridge at dawn — every walk is a hill walk.', lat: 31.1048, lng: 77.1734 },
  { slug: 'jammu', name: 'Jammu', state: 'Jammu and Kashmir', blurb: 'Tawi-river city, Trikuta treks on the weekend.', lat: 32.7266, lng: 74.857 },

  /* ---------------------------------------------------------------- tier 3 --
     District towns. Small boards, and honest about it. */
  { slug: 'mainpuri', name: 'Mainpuri', state: 'Uttar Pradesh', blurb: 'District town — the study room is above the market.', lat: 27.235, lng: 79.027 },
  { slug: 'etah', name: 'Etah', state: 'Uttar Pradesh', blurb: 'Small town, early risers, one very good badminton hall.', lat: 27.5580, lng: 78.662 },
  { slug: 'kannauj', name: 'Kannauj', state: 'Uttar Pradesh', blurb: 'Perfume city. Morning walks smell better here.', lat: 27.055, lng: 79.919 },
  { slug: 'etawah', name: 'Etawah', state: 'Uttar Pradesh', blurb: 'Yamuna-ravine town with a serious cycling crowd.', lat: 26.7855, lng: 79.015 },
  { slug: 'farrukhabad', name: 'Farrukhabad', state: 'Uttar Pradesh', blurb: 'Potato country, ghat walks, exam prep in winter.', lat: 27.39, lng: 79.58 },
  { slug: 'hardoi', name: 'Hardoi', state: 'Uttar Pradesh', blurb: 'Quiet district town, cricket on the college ground.', lat: 27.4165, lng: 80.1313 },
  { slug: 'sitapur', name: 'Sitapur', state: 'Uttar Pradesh', blurb: 'Naimisharanya road town, mornings start early.', lat: 27.5679, lng: 80.6828 },
  { slug: 'shahjahanpur', name: 'Shahjahanpur', state: 'Uttar Pradesh', blurb: 'Cantonment town on the Garra, running club of four.', lat: 27.8804, lng: 79.9097 },
  { slug: 'rae-bareli', name: 'Rae Bareli', state: 'Uttar Pradesh', blurb: 'Small city, big competitive-exam ambitions.', lat: 26.2301, lng: 81.2337 },
  { slug: 'jaunpur', name: 'Jaunpur', state: 'Uttar Pradesh', blurb: 'Gomti bridges and old mosques — good walking city.', lat: 25.7539, lng: 82.6836 },
  { slug: 'basti', name: 'Basti', state: 'Uttar Pradesh', blurb: 'District headquarters, one gym everybody uses.', lat: 26.814, lng: 82.7637 },
  { slug: 'deoria', name: 'Deoria', state: 'Uttar Pradesh', blurb: 'Sugarcane belt, cricket from November to March.', lat: 26.5024, lng: 83.7791 },
  { slug: 'ballia', name: 'Ballia', state: 'Uttar Pradesh', blurb: 'Where the Ganga meets the Ghaghara. Long river walks.', lat: 25.7585, lng: 84.1496 },
  { slug: 'mirzapur', name: 'Mirzapur', state: 'Uttar Pradesh', blurb: 'Carpet town on the Ganga, ghat steps at sunrise.', lat: 25.1449, lng: 82.5695 },
  { slug: 'banda', name: 'Banda', state: 'Uttar Pradesh', blurb: 'Bundelkhand town — summer study starts at four.', lat: 25.4761, lng: 80.3358 },
  { slug: 'orai', name: 'Orai', state: 'Uttar Pradesh', blurb: 'Small Bundelkhand town, one board, everybody knows it.', lat: 25.9903, lng: 79.4506 },
  { slug: 'bhind', name: 'Bhind', state: 'Madhya Pradesh', blurb: 'Chambal town with a real wrestling tradition.', lat: 26.5653, lng: 78.7875 },
  { slug: 'morena', name: 'Morena', state: 'Madhya Pradesh', blurb: 'Ravine country, gym crews that start at five.', lat: 26.4962, lng: 78.0 },
  { slug: 'chhindwara', name: 'Chhindwara', state: 'Madhya Pradesh', blurb: 'Satpura foothills — trek season is most of the year.', lat: 22.0574, lng: 78.9382 },
  { slug: 'satna', name: 'Satna', state: 'Madhya Pradesh', blurb: 'Cement town, Chitrakoot trips on a free Sunday.', lat: 24.5709, lng: 80.8322 },
  { slug: 'rewa', name: 'Rewa', state: 'Madhya Pradesh', blurb: 'White-tiger country, university crowd, cheap chai.', lat: 24.5362, lng: 81.3037 },
  { slug: 'bhilwara', name: 'Bhilwara', state: 'Rajasthan', blurb: 'Textile town, evening walks once the looms stop.', lat: 25.3407, lng: 74.6313 },
  { slug: 'sikar', name: 'Sikar', state: 'Rajasthan', blurb: 'Shekhawati coaching town — study groups everywhere.', lat: 27.6094, lng: 75.1399 },
  { slug: 'pali', name: 'Pali', state: 'Rajasthan', blurb: 'Marwar town, early mornings before the heat lands.', lat: 25.7711, lng: 73.3234 },
  { slug: 'hoshiarpur', name: 'Hoshiarpur', state: 'Punjab', blurb: 'Shivalik foothills, cycling out towards the dam.', lat: 31.5322, lng: 75.9117 },
  { slug: 'purnia', name: 'Purnia', state: 'Bihar', blurb: 'Seemanchal hub, football on the college maidan.', lat: 25.7771, lng: 87.4753 },
  { slug: 'chapra', name: 'Chapra', state: 'Bihar', blurb: 'Saran district town on the Ganga, dawn walks.', lat: 25.7815, lng: 84.7274 },
  { slug: 'anantapur', name: 'Anantapur', state: 'Andhra Pradesh', blurb: 'Dry-belt town — everything social happens after dusk.', lat: 14.6819, lng: 77.6006 },
  { slug: 'thanjavur', name: 'Thanjavur', state: 'Tamil Nadu', blurb: 'Temple town, delta walks, Carnatic practice rooms.', lat: 10.787, lng: 79.1378 },
  { slug: 'shivamogga', name: 'Shivamogga', state: 'Karnataka', blurb: 'Malnad gateway — waterfalls are a weekend habit.', lat: 13.9299, lng: 75.5681 },
  { slug: 'ballari', name: 'Ballari', state: 'Karnataka', blurb: 'Fort-hill town, Hampi is an hour away.', lat: 15.1394, lng: 76.9214 },
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

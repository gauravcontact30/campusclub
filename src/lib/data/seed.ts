import type { Business, DinnerEvent, PriceLevel, Review, UserProfile, WeekHours } from '@/types';

/* ------------------------------------------------------------------ */
/* Opening-hours presets (Monday-first)                                */
/* ------------------------------------------------------------------ */
const h = (open: string | null, close: string | null) => ({ open, close });
const closed = h(null, null);

const preset = {
  cafe: [h('07:30', '21:00'), h('07:30', '21:00'), h('07:30', '21:00'), h('07:30', '21:00'), h('07:30', '22:30'), h('08:00', '22:30'), h('08:00', '20:00')] as WeekHours,
  restaurant: [closed, h('12:00', '15:00'), h('12:00', '23:00'), h('12:00', '23:00'), h('12:00', '23:59'), h('11:30', '23:59'), h('11:30', '22:00')] as WeekHours,
  bar: [h('17:00', '00:30'), h('17:00', '00:30'), h('17:00', '01:00'), h('17:00', '01:00'), h('16:00', '02:00'), h('16:00', '02:00'), h('16:00', '23:00')] as WeekHours,
  service: [h('09:00', '18:00'), h('09:00', '18:00'), h('09:00', '18:00'), h('09:00', '18:00'), h('09:00', '17:00'), h('10:00', '14:00'), closed] as WeekHours,
  gym: [h('06:00', '22:00'), h('06:00', '22:00'), h('06:00', '22:00'), h('06:00', '22:00'), h('06:00', '21:00'), h('07:00', '19:00'), h('07:00', '19:00')] as WeekHours,
  salon: [closed, h('10:00', '19:00'), h('10:00', '19:00'), h('10:00', '20:00'), h('10:00', '20:00'), h('09:00', '20:00'), h('10:00', '17:00')] as WeekHours,
  clinic: [h('08:30', '19:00'), h('08:30', '19:00'), h('08:30', '19:00'), h('08:30', '19:00'), h('08:30', '17:00'), h('09:00', '13:00'), closed] as WeekHours,
  shop: [h('11:00', '20:00'), h('11:00', '20:00'), h('11:00', '20:00'), h('11:00', '20:00'), h('11:00', '21:00'), h('10:00', '21:00'), h('11:00', '19:00')] as WeekHours,
};

const cover = (n: number) => `/img/covers/cover-${String(((n - 1) % 12) + 1).padStart(2, '0')}.svg`;
const gallery = (n: number) => [cover(n), cover(n + 3), cover(n + 6), cover(n + 9), cover(n + 5)];

type Row = {
  name: string;
  category: keyof typeof categoryHours;
  city: string;
  state: string;
  neighborhood: string;
  address: string;
  postalCode: string;
  lat: number;
  lng: number;
  price: PriceLevel;
  tags: string[];
  description: string;
  amenities: string[];
  phone: string;
  claimed?: boolean;
};

const categoryHours = {
  restaurants: preset.restaurant,
  cafes: preset.cafe,
  bars: preset.bar,
  'home-services': preset.service,
  'beauty-spa': preset.salon,
  fitness: preset.gym,
  shopping: preset.shop,
  health: preset.clinic,
};

const rows: Row[] = [
  { name: 'Third Wave Filter Room', category: 'cafes', city: 'Bengaluru', state: 'Karnataka', neighborhood: 'Indiranagar', address: '12, 100 Feet Road', postalCode: '560038', lat: 12.9719, lng: 77.6412, price: 2, tags: ['Filter coffee', 'Bakes', 'Work-friendly'], description: 'A narrow, sunlit room that takes South Indian filter coffee as seriously as a single-origin pour-over. The counter seats eleven, the playlist is all vinyl, and the cardamom bun sells out before noon.', amenities: ['Free Wi-Fi', 'Accepts cards', 'Vegan options', 'Outdoor seating'], phone: '+91 80 4123 8890', claimed: true },
  { name: 'Nandini Dosa Camp', category: 'restaurants', city: 'Bengaluru', state: 'Karnataka', neighborhood: 'Malleshwaram', address: '7th Cross, Sampige Road', postalCode: '560003', lat: 13.0031, lng: 77.5697, price: 1, tags: ['South Indian', 'Breakfast', 'Legacy'], description: 'Four decades of benne dosa on the same cast-iron tawa. Queue outside from 7am, eat standing, leave changed. Cash preferred but they finally added a QR code in 2022.', amenities: ['Family friendly', 'Accepts cards'], phone: '+91 80 2334 5512' },
  { name: 'Copper & Rye', category: 'bars', city: 'Bengaluru', state: 'Karnataka', neighborhood: 'Koramangala', address: '80 Feet Road, 4th Block', postalCode: '560034', lat: 12.9345, lng: 77.6266, price: 3, tags: ['Cocktails', 'Small plates', 'Date night'], description: 'A twelve-seat cocktail bar behind an unmarked teak door. The menu changes with what the bartenders find at the Russell Market, and the toasted-rice old fashioned has a small cult.', amenities: ['Late night', 'Reservations', 'Accepts cards'], phone: '+91 80 4890 2211', claimed: true },
  { name: 'Sundar Home Repairs', category: 'home-services', city: 'Bengaluru', state: 'Karnataka', neighborhood: 'HSR Layout', address: '27, Sector 2', postalCode: '560102', lat: 12.9121, lng: 77.6446, price: 2, tags: ['Plumbing', 'Electrical', 'Same day'], description: 'A five-person crew that actually arrives inside the two-hour window they promise. Transparent parts pricing sent over WhatsApp before any work starts.', amenities: ['Accepts cards', 'Parking'], phone: '+91 98450 33122', claimed: true },
  { name: 'The Long Room Studio', category: 'fitness', city: 'Bengaluru', state: 'Karnataka', neighborhood: 'Jayanagar', address: '11th Main, 4th Block', postalCode: '560011', lat: 12.9250, lng: 77.5938, price: 3, tags: ['Reformer pilates', 'Small groups', 'Beginner friendly'], description: 'Eight reformers, no mirrors, and instructors who remember which shoulder you injured. Classes cap at eight so nobody hides in the back row.', amenities: ['Wheelchair accessible', 'Accepts cards', 'Parking'], phone: '+91 80 4712 0098' },
  { name: 'Paperboat Bookshop', category: 'shopping', city: 'Bengaluru', state: 'Karnataka', neighborhood: 'Basavanagudi', address: 'Gandhi Bazaar Main Road', postalCode: '560004', lat: 12.9425, lng: 77.5730, price: 2, tags: ['Independent', 'Translations', 'Events'], description: 'Kannada translations at the front, a startlingly good poetry wall at the back, and a Thursday reading series that regularly runs out of chairs.', amenities: ['Free Wi-Fi', 'Accepts cards', 'Family friendly'], phone: '+91 80 2667 1140' },
  { name: 'Bandra Bhaji Bar', category: 'restaurants', city: 'Mumbai', state: 'Maharashtra', neighborhood: 'Bandra West', address: 'Waroda Road', postalCode: '400050', lat: 19.0596, lng: 72.8295, price: 2, tags: ['Street food', 'Late night', 'Vegetarian'], description: 'Pav bhaji finished with an obscene amount of butter, served until one in the morning to a crowd of musicians, nurses and cab drivers.', amenities: ['Late night', 'Vegan options', 'Accepts cards'], phone: '+91 22 2640 8877' },
  { name: 'Salt & Sea Trattoria', category: 'restaurants', city: 'Mumbai', state: 'Maharashtra', neighborhood: 'Colaba', address: 'Mandlik Road', postalCode: '400001', lat: 18.9220, lng: 72.8330, price: 4, tags: ['Italian', 'Seafood', 'Wine list'], description: 'Coastal Italian by way of the Sassoon Dock auction. The tasting menu is six courses of restraint; the bar does a Negroni with local vermouth.', amenities: ['Reservations', 'Accepts cards', 'Outdoor seating'], phone: '+91 22 2202 4411', claimed: true },
  { name: 'Marine Drive Barbers', category: 'beauty-spa', city: 'Mumbai', state: 'Maharashtra', neighborhood: 'Churchgate', address: 'Veer Nariman Road', postalCode: '400020', lat: 18.9322, lng: 72.8264, price: 2, tags: ['Hot towel', 'Walk-ins', 'Old school'], description: 'A chrome-and-leather barbershop that has been cutting the same fade since 1974. Twenty minutes, hot towel included, no appointment culture.', amenities: ['Accepts cards', 'Wheelchair accessible'], phone: '+91 22 2204 5566' },
  { name: 'Sanjeevani Family Clinic', category: 'health', city: 'Mumbai', state: 'Maharashtra', neighborhood: 'Dadar', address: 'Ranade Road', postalCode: '400028', lat: 19.0212, lng: 72.8424, price: 2, tags: ['GP', 'Paediatrics', 'Walk-ins'], description: 'A neighbourhood practice where the doctor still calls the next day to check on you. Digital records, printed prescriptions, twelve-minute average wait.', amenities: ['Wheelchair accessible', 'Accepts cards', 'Family friendly'], phone: '+91 22 2445 9090', claimed: true },
  { name: 'Chandni Chowk Chai House', category: 'cafes', city: 'Delhi', state: 'Delhi', neighborhood: 'Old Delhi', address: 'Gali Paranthe Wali', postalCode: '110006', lat: 28.6562, lng: 77.2307, price: 1, tags: ['Chai', 'Heritage', 'Cash'], description: 'Clay cups, a coal fire and a queue that snakes past the paratha shops. Order the tulsi chai and stand where the locals stand.', amenities: ['Family friendly'], phone: '+91 11 2326 7712' },
  { name: 'Hauz Khas Vinyl Bar', category: 'bars', city: 'Delhi', state: 'Delhi', neighborhood: 'Hauz Khas', address: 'Deer Park Road', postalCode: '110016', lat: 28.5535, lng: 77.1943, price: 3, tags: ['Listening bar', 'Whisky', 'No TV'], description: 'A listening bar built around a restored 1978 sound system. Conversation is welcome, shouting is not, and the whisky flight leans Japanese.', amenities: ['Late night', 'Reservations', 'Accepts cards'], phone: '+91 11 4106 3320', claimed: true },
  { name: 'GK Movers & Fitters', category: 'home-services', city: 'Delhi', state: 'Delhi', neighborhood: 'Greater Kailash', address: 'M Block Market', postalCode: '110048', lat: 28.5495, lng: 77.2426, price: 2, tags: ['Moving', 'Assembly', 'Insured'], description: 'Packers who label every box and re-assemble the wardrobe they took apart. Fixed quotes, insured in transit, no surprise loading charges.', amenities: ['Accepts cards', 'Parking'], phone: '+91 98110 44521' },
  { name: 'The Clerkenwell Table', category: 'restaurants', city: 'London', state: 'England', neighborhood: 'Clerkenwell', address: '42 St John Street', postalCode: 'EC1M 4AY', lat: 51.5223, lng: -0.1024, price: 3, tags: ['British', 'Seasonal', 'Long table'], description: 'One menu, one sitting, one very long communal table. Whatever the market gave them that morning arrives in four courses, and strangers leave as a table.', amenities: ['Reservations', 'Accepts cards', 'Vegan options'], phone: '+44 20 7253 8811', claimed: true },
  { name: 'Peckham Roasters', category: 'cafes', city: 'London', state: 'England', neighborhood: 'Peckham', address: '9 Blenheim Grove', postalCode: 'SE15 4QL', lat: 51.4713, lng: -0.0691, price: 2, tags: ['Speciality coffee', 'Pastries', 'Dog friendly'], description: 'A railway-arch roastery with a two-group lever machine and a queue of prams. The cortado is the benchmark everyone in SE15 measures against.', amenities: ['Free Wi-Fi', 'Pet friendly', 'Outdoor seating', 'Accepts cards'], phone: '+44 20 7639 2210' },
  { name: 'Soho Sound Barbers', category: 'beauty-spa', city: 'London', state: 'England', neighborhood: 'Soho', address: '18 Berwick Street', postalCode: 'W1F 8RD', lat: 51.5138, lng: -0.1362, price: 3, tags: ['Barbering', 'Beard', 'Records'], description: 'Cuts on the ground floor, a record shop in the basement, and a waiting bench that has heard every band argument in Soho since 1998.', amenities: ['Accepts cards', 'Late night'], phone: '+44 20 7434 5566' },
  { name: 'Hackney Strength Club', category: 'fitness', city: 'London', state: 'England', neighborhood: 'Hackney', address: '211 Mare Street', postalCode: 'E8 3QE', lat: 51.5432, lng: -0.0554, price: 3, tags: ['Strength', 'Coaching', '24/7'], description: 'Platforms, chalk and coaches who program for people with desk jobs. No mirrors selfie wall, no contracts, just a barbell and a plan.', amenities: ['Parking', 'Accepts cards', 'Wheelchair accessible'], phone: '+44 20 8985 3300', claimed: true },
  { name: 'Greenpoint Supper Club', category: 'restaurants', city: 'New York', state: 'NY', neighborhood: 'Greenpoint', address: '155 Franklin Street', postalCode: '11222', lat: 40.7305, lng: -73.9566, price: 3, tags: ['New American', 'Natural wine', 'Communal'], description: 'A twenty-two seat room where dinner is served family style at 7pm sharp. The chef announces each dish from the pass, and the wine is all low-intervention.', amenities: ['Reservations', 'Accepts cards', 'Vegan options'], phone: '+1 718 383 2210', claimed: true },
  { name: 'Bowery Espresso Bar', category: 'cafes', city: 'New York', state: 'NY', neighborhood: 'Lower East Side', address: '77 Bowery', postalCode: '10002', lat: 40.7168, lng: -73.9958, price: 2, tags: ['Espresso', 'Standing bar', 'Fast'], description: 'Italian-style standing bar: no laptops, no oat milk debates, ninety-second espresso and a pistachio cornetto out the door.', amenities: ['Accepts cards'], phone: '+1 212 966 4412' },
  { name: 'East Village Nail Studio', category: 'beauty-spa', city: 'New York', state: 'NY', neighborhood: 'East Village', address: '311 E 9th Street', postalCode: '10003', lat: 40.7284, lng: -73.9857, price: 3, tags: ['Nails', 'Non-toxic', 'By appointment'], description: 'A five-chair studio using only 10-free polish, with a booking app that actually reflects availability. Ninety-minute slots, no upsell script.', amenities: ['Accepts cards', 'Wheelchair accessible'], phone: '+1 212 477 8890' },
  { name: 'Brooklyn Bike Doctor', category: 'home-services', city: 'New York', state: 'NY', neighborhood: 'Williamsburg', address: '88 N 6th Street', postalCode: '11249', lat: 40.7192, lng: -73.9601, price: 2, tags: ['Mobile repair', 'Tune-ups', 'Same day'], description: 'A van, a stand and a mechanic who will fix your drivetrain outside your building while you take a call. Parts at cost plus labour, itemised.', amenities: ['Accepts cards', 'Parking'], phone: '+1 347 220 1187' },
  { name: 'Alfama Tasca do Fado', category: 'restaurants', city: 'Lisbon', state: 'Lisboa', neighborhood: 'Alfama', address: 'Rua dos Remédios 74', postalCode: '1100-443', lat: 38.7128, lng: -9.1276, price: 2, tags: ['Portuguese', 'Fado', 'Family run'], description: 'Grilled sardines, house vinho verde and live fado from ten. Grandmother cooks, grandson sings, and the room goes silent for both.', amenities: ['Family friendly', 'Late night', 'Accepts cards'], phone: '+351 21 886 3311' },
  { name: 'Príncipe Real Roastery', category: 'cafes', city: 'Lisbon', state: 'Lisboa', neighborhood: 'Príncipe Real', address: 'Rua da Escola Politécnica 20', postalCode: '1250-100', lat: 38.7167, lng: -9.1494, price: 2, tags: ['Coffee', 'Brunch', 'Garden'], description: 'A tiled townhouse with a walled garden out back, roasting on a 5kg Probat that you can watch from the counter.', amenities: ['Outdoor seating', 'Free Wi-Fi', 'Vegan options', 'Pet friendly'], phone: '+351 21 347 2200', claimed: true },
  { name: 'Cais do Sodré Wine Room', category: 'bars', city: 'Lisbon', state: 'Lisboa', neighborhood: 'Cais do Sodré', address: 'Rua Nova do Carvalho 42', postalCode: '1200-292', lat: 38.7071, lng: -9.1449, price: 3, tags: ['Wine bar', 'Petiscos', 'Pink street'], description: 'Forty Portuguese wines by the glass in a room the size of a generous kitchen. Ask for something from the Dão and let them argue about it.', amenities: ['Late night', 'Outdoor seating', 'Accepts cards'], phone: '+351 21 346 7788' },
];

export const SEED_BUSINESSES: Business[] = rows.map((r, i) => ({
  id: `b${String(i + 1).padStart(3, '0')}`,
  slug: `${r.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}-${r.city.toLowerCase().replace(/\s+/g, '-')}`,
  name: r.name,
  categorySlug: r.category,
  tags: r.tags,
  description: r.description,
  phone: r.phone,
  website: `https://www.${r.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.example`,
  address: r.address,
  neighborhood: r.neighborhood,
  city: r.city,
  state: r.state,
  postalCode: r.postalCode,
  lat: r.lat,
  lng: r.lng,
  priceLevel: r.price,
  coverImage: cover(i + 1),
  images: gallery(i + 1),
  hours: categoryHours[r.category],
  amenities: r.amenities,
  ownerId: r.claimed ? 'u001' : null,
  isClaimed: Boolean(r.claimed),
  createdAt: new Date(Date.UTC(2023, i % 12, ((i * 3) % 27) + 1)).toISOString(),
  rating: 0,
  reviewCount: 0,
}));

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */
const people = [
  ['Aarav Mehta', 'aarav@example.com', 'Bengaluru', 'Product designer. Will queue 40 minutes for a dosa.'],
  ['Priya Nair', 'priya@example.com', 'Mumbai', 'Doctor by day, natural wine evangelist by night.'],
  ['Daniel Osei', 'daniel@example.com', 'London', 'Structural engineer. Believes every city is a coffee city.'],
  ['Sofia Almeida', 'sofia@example.com', 'Lisbon', 'Translator. Sits at the loudest end of the table.'],
  ['Mei Lin Chow', 'mei@example.com', 'New York', 'Data scientist, marathon-adjacent, ferocious about noodles.'],
  ['Rohan Kapoor', 'rohan@example.com', 'Delhi', 'Sound engineer. Owns more records than shelves.'],
  ['Elena Rossi', 'elena@example.com', 'London', 'Chef turned food writer. Reviews are long, sorry.'],
  ['Kabir Shah', 'kabir@example.com', 'Bengaluru', 'Founder. Has opinions on filter coffee ratios.'],
];

export const SEED_USERS: (UserProfile & { password: string })[] = people.map((p, i) => ({
  id: `u${String(i + 1).padStart(3, '0')}`,
  email: p[1],
  password: 'password123',
  fullName: p[0],
  avatarUrl: `/img/avatars/a-${String(i + 1).padStart(2, '0')}.svg`,
  city: p[2],
  bio: p[3],
  plan: (i === 0 ? 'monthly' : i === 1 ? 'quarterly' : 'free') as UserProfile['plan'],
  createdAt: new Date(Date.UTC(2023, i, 12)).toISOString(),
}));

/* ------------------------------------------------------------------ */
/* Reviews — deterministic spread so ratings look organic              */
/* ------------------------------------------------------------------ */
const reviewCopy: { rating: number; title: string; body: string }[] = [
  { rating: 5, title: 'Now my default answer to "where should we go?"', body: 'Third visit this month and it has not slipped once. The staff clocked that I always order the same thing and started making it before I reached the counter. Small thing, but that is why I keep coming back.' },
  { rating: 4, title: 'Excellent, if you time it right', body: 'Between one and two on a weekday it is chaos and you will stand. Come at four instead and it is one of the calmest rooms in the neighbourhood. Docking a star purely for the crush at peak.' },
  { rating: 5, title: 'Worth crossing the city for', body: 'I live forty minutes away and I still do this twice a month. Everything arrives at the right temperature, the pricing is honest and nobody rushes you out. Genuinely hard to fault.' },
  { rating: 3, title: 'Good, not the revelation I was promised', body: 'Perfectly pleasant and I would go again with friends, but the queue outside had me expecting fireworks. Solid execution, slightly overhyped by the internet.' },
  { rating: 5, title: 'The staff make it', body: 'Turned up ten minutes before closing, fully expecting to be turned away, and instead got a seat and a recommendation that turned out to be the best thing on the menu. That is service.' },
  { rating: 4, title: 'Reliable for a group', body: 'Booked for eight on a Friday, which is usually a disaster. They split the bill without being asked and got everything out within a few minutes of each other. Will use again for work dinners.' },
  { rating: 2, title: 'Off night, hopefully', body: 'Waited thirty-five minutes for something that arrived lukewarm, and the follow-up was a shrug. I have heard enough good things to try once more, but this was not it.' },
  { rating: 5, title: 'Quietly brilliant', body: 'No branding, no queue-jumping, no theatre. Just people who are very good at one thing doing it every day. The kind of place you hope never gets discovered, which is ironic given I am reviewing it.' },
  { rating: 4, title: 'Great value for what you get', body: 'Prices have not moved much in two years while everything around it has. The quality has held too. Comfortable recommending it to anyone watching what they spend.' },
  { rating: 5, title: 'Took my parents, they were delighted', body: 'Accessible entrance, patient with questions, and they happily adjusted a dish for my mother. Rare combination and the reason this gets five stars from me.' },
  { rating: 3, title: 'Depends entirely who is on shift', body: 'Weekday afternoons: attentive and warm. Weekend evenings: distracted and slow. Same place, two different experiences, so know what you are walking into.' },
  { rating: 4, title: 'Booked on a whim, stayed three hours', body: 'Intended to be a quick stop. Ended up talking to the people at the next table until they turned the lights up. The room does something to conversation.' },
  { rating: 5, title: 'Fixed what two other people could not', body: 'Diagnosed the actual problem in ten minutes, quoted before starting, and charged exactly what was quoted. I have saved the number and given it to half my building.' },
  { rating: 4, title: 'Clean, on time, no theatrics', body: 'Arrived inside the window, laid down covers without being asked, cleaned up after. Slightly pricier than the alternatives and honestly worth it for not having to chase anyone.' },
  { rating: 5, title: 'Beginner friendly in a real way', body: 'I was worried about being the least fit person in the room. The coach adjusted three things for me quietly, without making it a moment. Six weeks in and I have not missed a session.' },
];

const dedupe = new Set<string>();
export const SEED_REVIEWS: Review[] = SEED_BUSINESSES.flatMap((biz, bi) => {
  const count = 3 + ((bi * 7 + 4) % 6); // 3..8 reviews each
  return Array.from({ length: count }, (_, ri) => {
    const userIndex = (bi + ri * 3) % SEED_USERS.length;
    const user = SEED_USERS[userIndex];
    const key = `${biz.id}:${user.id}`;
    if (dedupe.has(key)) return null;
    dedupe.add(key);
    const copy = reviewCopy[(bi * 4 + ri * 5 + userIndex * 7) % reviewCopy.length];
    const daysAgo = 4 + ((bi * 11 + ri * 13) % 300);
    return {
      id: `r-${biz.id}-${ri}`,
      businessId: biz.id,
      userId: user.id,
      authorName: user.fullName,
      authorAvatar: user.avatarUrl,
      rating: copy.rating,
      title: copy.title,
      body: copy.body,
      photos: ri % 4 === 0 ? [biz.images[(ri + 1) % biz.images.length]] : [],
      helpfulCount: (bi * 7 + ri * 5) % 24,
      createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    } satisfies Review;
  }).filter((r): r is Review => r !== null);
});

/* ------------------------------------------------------------------ */
/* Dinner events — every Wednesday 20:00, rolling four weeks           */
/* ------------------------------------------------------------------ */
const dinnerCities = [
  { city: 'Bengaluru', neighborhood: 'Indiranagar', venue: 'Copper & Rye', price: 129900, language: 'English', vibe: 'Curious & chatty' },
  { city: 'Mumbai', neighborhood: 'Bandra West', venue: 'Salt & Sea Trattoria', price: 149900, language: 'English', vibe: 'Loud, warm, late' },
  { city: 'Delhi', neighborhood: 'Hauz Khas', venue: 'Hauz Khas Vinyl Bar', price: 119900, language: 'Hindi & English', vibe: 'Music people' },
  { city: 'London', neighborhood: 'Clerkenwell', venue: 'The Clerkenwell Table', price: 349900, language: 'English', vibe: 'Long table, four courses' },
  { city: 'New York', neighborhood: 'Greenpoint', venue: 'Greenpoint Supper Club', price: 399900, language: 'English', vibe: 'Natural wine & noise' },
  { city: 'Lisbon', neighborhood: 'Alfama', venue: 'Alfama Tasca do Fado', price: 219900, language: 'Portuguese & English', vibe: 'Fado from ten' },
];

function nextWednesday(weeksAhead: number) {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  const delta = (3 - d.getDay() + 7) % 7 || 7; // next Wednesday
  d.setDate(d.getDate() + delta + weeksAhead * 7);
  return d;
}

export const SEED_DINNERS: DinnerEvent[] = dinnerCities.flatMap((c, ci) =>
  [0, 1, 2, 3].map((w) => {
    const starts = nextWednesday(w);
    const seatsTotal = 6;
    return {
      id: `d-${c.city.toLowerCase().replace(/\s+/g, '')}-${w}`,
      city: c.city,
      neighborhood: c.neighborhood,
      venueName: c.venue,
      venueRevealAt: new Date(starts.getTime() - 36 * 3_600_000).toISOString(),
      startsAt: starts.toISOString(),
      seatsTotal,
      seatsTaken: [4, 5, 2, 3, 6, 1][(ci + w) % 6],
      priceCents: c.price,
      language: c.language,
      vibe: c.vibe,
      coverImage: cover(ci * 2 + w + 1),
      hostNotes:
        'Six strangers, one table, three hours. We send the venue address 36 hours before, the icebreaker deck lands on your phone at 20:15, and where the night goes after dessert is entirely up to the table.',
    } satisfies DinnerEvent;
  }),
);

import type { Audience, Cadence, HostSummary, Level, Meetup, UserProfile, Vouch } from '@/types';
import { slugify } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Time helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Seeded meetups are pinned to *today*, not to a fixed calendar date, so the
 * demo is never a graveyard of meetups that happened last year. Everything is
 * expressed as an offset in days from midnight this morning.
 */
function at(dayOffset: number, hour: number, minute = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function plusMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

const people: [name: string, email: string, city: string, bio: string, interests: string[]][] = [
  ['Aarav Mehta', 'aarav@example.com', 'Bengaluru', 'Product designer. Runs a Saturday sketching table that has outlived three jobs.', ['skills', 'outdoors']],
  ['Priya Nair', 'priya@example.com', 'Mumbai', 'Resident doctor. Books the 6am court because it is the only hour nobody pages me.', ['sports', 'gym']],
  ['Kabir Shah', 'kabir@example.com', 'Bengaluru', 'CAT 99.4. Now hosts the mock-test table I wish I had had.', ['exam-prep', 'group-study']],
  ['Ananya Rao', 'ananya@example.com', 'Hyderabad', 'Final-year law student. Will absolutely make you put your phone in the box.', ['group-study', 'breakfast-lunch']],
  ['Rohan Kapoor', 'rohan@example.com', 'Delhi', 'Sound engineer. Cooks for eight, badly, happily.', ['dinner', 'skills']],
  ['Meera Iyer', 'meera@example.com', 'Chennai', 'Marathoner, four times. Still the slowest person in her own run group.', ['outdoors', 'gym']],
  ['Vikram Sethi', 'vikram@example.com', 'Pune', 'GATE aspirant, second attempt. Believes in the 5am library.', ['exam-prep', 'group-study']],
  ['Sara Qureshi', 'sara@example.com', 'Mumbai', 'Illustrator. Hosts an open sketch night where nobody is allowed to apologise for their work.', ['skills', 'dinner']],
  ['Aditya Menon', 'aditya@example.com', 'Bengaluru', 'Backend engineer. Deadlifts, debugs, disappears at 9pm.', ['gym', 'sports']],
  ['Nisha Gupta', 'nisha@example.com', 'Delhi', 'UPSC, mains cleared once. Runs the morning answer-writing table in Rajinder Nagar.', ['exam-prep', 'breakfast-lunch']],
  ['Tanvi Deshmukh', 'tanvi@example.com', 'Pune', 'Architecture student. Long lunches, longer arguments.', ['breakfast-lunch', 'skills']],
  ['Arjun Reddy', 'arjun@example.com', 'Hyderabad', 'Box cricket organiser since college. Owns four bats, none of them good.', ['sports', 'dinner']],
];

export const SEED_USERS: (UserProfile & { password: string })[] = people.map((p, i) => ({
  id: `u${String(i + 1).padStart(3, '0')}`,
  email: p[1],
  password: 'password123',
  fullName: p[0],
  // Null on purpose: the Avatar falls back to token-coloured initials, which
  // follow the theme. A shipped PNG would be the one thing on the page that
  // does not.
  avatarUrl: null,
  city: p[2],
  bio: p[3],
  pass: (i === 0 ? 'regular' : i === 1 ? 'starter' : 'payg') as UserProfile['pass'],
  credits: i === 0 ? 7 : i === 1 ? 3 : 0,
  interests: p[4],
  createdAt: new Date(Date.UTC(2024, i % 12, ((i * 5) % 26) + 1)).toISOString(),
}));

/** Hosting reputation. Derived here so demo and Supabase agree on the shape. */
const hostStats: [hosted: number, rating: number, verified: boolean][] = [
  [34, 4.9, true],
  [21, 4.8, true],
  [46, 5.0, true],
  [12, 4.7, true],
  [18, 4.6, false],
  [29, 4.9, true],
  [9, 4.5, false],
  [23, 4.8, true],
  [15, 4.7, true],
  [31, 4.9, true],
  [7, 4.6, false],
  [26, 4.8, true],
];

export const SEED_HOSTS: HostSummary[] = SEED_USERS.map((u, i) => ({
  id: u.id,
  name: u.fullName,
  avatarUrl: u.avatarUrl,
  city: u.city,
  bio: u.bio,
  hostedCount: hostStats[i][0],
  rating: hostStats[i][1],
  verified: hostStats[i][2],
  memberSince: u.createdAt,
}));

/* ------------------------------------------------------------------ */
/* Meetups                                                             */
/* ------------------------------------------------------------------ */

type Row = {
  title: string;
  category: string;
  host: number;
  city: string;
  state: string;
  area: string;
  venue: string;
  address: string;
  lat: number;
  lng: number;
  /** Days from today. */
  day: number;
  hour: number;
  minute?: number;
  mins: number;
  spots: number;
  taken: number;
  fee: number;
  level: Level;
  audience?: Audience;
  language?: string;
  cadence?: Cadence;
  tags: string[];
  description: string;
  agenda: string[];
  bring: string[];
};

const rows: Row[] = [
  /* ------------------------------- Bengaluru ------------------------------ */
  {
    title: 'Deep work table — 3 hours, phones in the box',
    category: 'group-study', host: 2, city: 'Bengaluru', state: 'Karnataka', area: 'Indiranagar',
    venue: 'Third Wave Filter Room', address: '12, 100 Feet Road', lat: 12.9719, lng: 77.6412,
    day: 1, hour: 9, mins: 180, spots: 8, taken: 6, fee: 14900, level: 'serious',
    tags: ['Silent', 'Wi-Fi', 'Pomodoro'],
    description:
      'Four 45-minute blocks with strict 10-minute breaks. Phones go in a box on the counter at the start and come back out at the end. Nobody talks during a block — the whole point is that eight people holding each other to it is easier than one person trying alone.',
    agenda: ['09:00 — arrive, set your one goal on the board', '09:15 — first two blocks, silent', '10:55 — coffee break, talk as much as you like', '11:15 — final two blocks, then a two-minute wrap'],
    bring: ['Laptop', 'Notebook & pen'],
  },
  {
    title: 'Sunrise loop around Ulsoor Lake',
    category: 'outdoors', host: 0, city: 'Bengaluru', state: 'Karnataka', area: 'Ulsoor',
    venue: 'Ulsoor Lake — main gate', address: 'Ulsoor Lake Road', lat: 12.9825, lng: 77.6207,
    day: 1, hour: 6, minute: 15, mins: 60, spots: 14, taken: 9, fee: 4900, level: 'any', cadence: 'daily',
    tags: ['5K', 'Beginner pace group', 'Chai after'],
    description:
      'Two pace groups — roughly 7:00/km and roughly 5:30/km — so nobody runs alone and nobody gets dropped. We finish at the tea stall by the north gate, which is genuinely the best part.',
    agenda: ['06:15 — warm-up together at the gate', '06:25 — split into two pace groups, 5K loop', '07:00 — stretch and chai'],
    bring: ['Sports shoes', 'Water bottle'],
  },
  {
    title: 'Push day, and someone to count your last three',
    category: 'gym', host: 8, city: 'Bengaluru', state: 'Karnataka', area: 'Koramangala',
    venue: 'Iron Yard Koramangala', address: '80 Feet Road, 4th Block', lat: 12.9345, lng: 77.6266,
    day: 2, hour: 19, mins: 75, spots: 6, taken: 4, fee: 19900, level: 'intermediate', cadence: 'weekly',
    tags: ['Chest & shoulders', 'Spotters', 'Day pass included'],
    description:
      'A fixed push session run in pairs so everyone gets a spotter. The gym day pass is inside the join fee — you do not pay anything at the counter. I write the session on the whiteboard before we start; you can scale every lift down without anyone raising an eyebrow.',
    agenda: ['19:00 — pair up and warm up', '19:10 — bench, incline, overhead, in rotation', '19:55 — accessories, your choice', '20:15 — done'],
    bring: ['Water bottle', 'A towel'],
  },
  {
    title: 'Saturday sketch table — no apologising for your work',
    category: 'skills', host: 0, city: 'Bengaluru', state: 'Karnataka', area: 'Cubbon Park',
    venue: 'Cubbon Park bandstand', address: 'Kasturba Road entrance', lat: 12.9763, lng: 77.5929,
    day: 5, hour: 16, mins: 120, spots: 12, taken: 5, fee: 9900, level: 'beginner', cadence: 'weekly',
    tags: ['Urban sketching', 'All levels', 'Materials to share'],
    description:
      'Bring whatever you draw with. Two hours of sketching the park, then twenty minutes where we lay everything out on the ground and look at it. The one rule is that nobody is allowed to open with "this is terrible, but".',
    agenda: ['16:00 — five-minute warm-up gestures', '16:20 — one long piece, wherever you like', '17:40 — lay it all out, look, talk'],
    bring: ['Notebook & pen', 'Just yourself'],
  },
  {
    title: 'Badminton doubles — rotating partners',
    category: 'sports', host: 8, city: 'Bengaluru', state: 'Karnataka', area: 'HSR Layout',
    venue: 'Smash Arena', address: '27, Sector 2, HSR Layout', lat: 12.9121, lng: 77.6446,
    day: 3, hour: 20, mins: 90, spots: 8, taken: 8, fee: 24900, level: 'any', cadence: 'weekly',
    tags: ['Court booked', 'Rackets available', 'Shuttles included'],
    description:
      'Two courts, eight people, partners rotate every game so you play with everyone. Court hire and shuttles are in the fee. Genuinely fine if you last played in school — half the group is in that bracket.',
    agenda: ['20:00 — knock-up', '20:10 — rotating doubles, eleven-point games', '21:25 — last game, whoever is left standing'],
    bring: ['Sports shoes', 'Racket (spares available)'],
  },
  {
    title: 'Long breakfast — dosa, then nowhere to be',
    category: 'breakfast-lunch', host: 3, city: 'Bengaluru', state: 'Karnataka', area: 'Malleshwaram',
    venue: 'Nandini Dosa Camp', address: '7th Cross, Sampige Road', lat: 13.0031, lng: 77.5697,
    day: 6, hour: 8, minute: 30, mins: 105, spots: 6, taken: 3, fee: 9900, level: 'any',
    tags: ['Vegetarian', 'Cash-free', 'Six people'],
    description:
      'Benne dosa at a place that has been doing one thing since 1981. Six of us, one long table, and no agenda beyond eating slowly on a Sunday. Food is separate — you pay for what you order.',
    agenda: ['08:30 — meet outside, queue together', '08:50 — eat', '09:40 — filter coffee and the good conversation'],
    bring: ['Just yourself'],
  },

  /* --------------------------------- Mumbai ------------------------------- */
  {
    title: 'CAT mocks — full paper, then two hours of analysis',
    category: 'exam-prep', host: 2, city: 'Mumbai', state: 'Maharashtra', area: 'Andheri West',
    venue: 'Lokhandwala Study Hall', address: 'Level 2, Crystal Plaza', lat: 19.1364, lng: 72.8296,
    day: 2, hour: 10, mins: 300, spots: 10, taken: 7, fee: 29900, level: 'serious', cadence: 'weekly',
    tags: ['Timed paper', 'Analysis', 'Question bank'],
    description:
      'A real mock under real conditions — three sections, sectional timing, no phone. Then the part almost everyone skips: two hours going through the paper as a group, question by question, arguing about approaches.',
    agenda: ['10:00 — paper starts, strictly timed', '12:00 — break, eat something', '12:40 — group analysis, section by section', '15:00 — set your week from what broke'],
    bring: ['Question bank', 'Notebook & pen'],
  },
  {
    title: '6am court before the hospital shift',
    category: 'sports', host: 1, city: 'Mumbai', state: 'Maharashtra', area: 'Bandra West',
    venue: 'Bandra Gymkhana courts', address: 'Turner Road', lat: 19.0596, lng: 72.8295,
    day: 1, hour: 6, mins: 75, spots: 8, taken: 6, fee: 19900, level: 'intermediate', cadence: 'weekly',
    tags: ['Early', 'Doubles', 'Court booked'],
    description:
      'The only hour that reliably belongs to me, so I book it and fill it. Fast doubles, everyone is out by 7:20 and at work by nine. Punctuality matters here more than skill.',
    agenda: ['06:00 — on court, knock-up', '06:10 — games', '07:15 — off, out, gone'],
    bring: ['Sports shoes', 'Racket (spares available)'],
  },
  {
    title: 'Open sketch night — bring the drawing you hate',
    category: 'skills', host: 7, city: 'Mumbai', state: 'Maharashtra', area: 'Colaba',
    venue: 'Kala Ghoda studio loft', address: 'Rampart Row', lat: 18.9282, lng: 72.8324,
    day: 4, hour: 19, minute: 30, mins: 120, spots: 14, taken: 11, fee: 14900, level: 'any', cadence: 'weekly',
    tags: ['Life drawing', 'Critique', 'BYO materials'],
    description:
      'An hour of drawing to a timer, then an hour where we pin work up and talk about it properly. Bring the piece you gave up on — that is usually the one worth twenty minutes of eight people looking at it.',
    agenda: ['19:30 — timed poses, 2 / 5 / 10 / 20 minutes', '20:30 — pin-up and critique', '21:30 — pack down'],
    bring: ['Notebook & pen', 'Just yourself'],
  },
  {
    title: 'Sunday dinner for eight, cooked in front of you',
    category: 'dinner', host: 7, city: 'Mumbai', state: 'Maharashtra', area: 'Khar',
    venue: "Host's home kitchen — address on join", address: '14th Road, Khar West', lat: 19.0728, lng: 72.8347,
    day: 6, hour: 19, mins: 180, spots: 8, taken: 6, fee: 49900, level: 'any',
    tags: ['Home cooked', 'Vegetarian option', 'Address revealed on join'],
    description:
      'I cook, you sit at the counter and watch it happen, and we eat when it is ready — which is usually later than promised. Food and everything to drink is inside the fee. Exact address goes out once you join.',
    agenda: ['19:00 — arrive, first course while I finish the second', '20:00 — everyone at the table', '22:00 — the part where nobody leaves'],
    bring: ['Just yourself'],
  },
  {
    title: 'Working lunch — freelancers, one table, one hour',
    category: 'breakfast-lunch', host: 7, city: 'Mumbai', state: 'Maharashtra', area: 'Lower Parel',
    venue: 'Kamala Mills canteen', address: 'Trade World, Kamala Mills', lat: 18.9949, lng: 72.8258,
    day: 3, hour: 13, mins: 75, spots: 10, taken: 4, fee: 4900, level: 'any', cadence: 'weekly',
    tags: ['Freelancers', 'Cheap', 'No pitching'],
    description:
      'Working from home five days a week is quietly corrosive. This is one hour, once a week, eating with other people who also have nobody to eat with. No pitching, no business cards, no LinkedIn follow-ups.',
    agenda: ['13:00 — grab food, sit down', '13:15 — talk about anything but scope creep', '14:15 — back to it'],
    bring: ['Just yourself'],
  },

  /* --------------------------------- Delhi -------------------------------- */
  {
    title: 'UPSC answer writing — four questions, marked in the room',
    category: 'exam-prep', host: 9, city: 'Delhi', state: 'Delhi', area: 'Rajinder Nagar',
    venue: 'Old Rajinder Nagar reading room', address: 'Bada Bazaar Road', lat: 28.6398, lng: 77.1839,
    day: 1, hour: 7, mins: 150, spots: 12, taken: 10, fee: 14900, level: 'serious', cadence: 'daily',
    tags: ['GS mains', 'Peer marking', 'Every weekday'],
    description:
      'Four questions in ninety minutes, handwritten, timed. Then we swap papers and mark each other against the actual rubric. Reading someone else\'s answer is the fastest way to see what is wrong with your own.',
    agenda: ['07:00 — questions on the board', '08:30 — pens down, swap papers', '09:00 — marks and one comment each', '09:30 — out'],
    bring: ['Notebook & pen', 'Question bank'],
  },
  {
    title: 'Evening badminton at Siri Fort',
    category: 'sports', host: 4, city: 'Delhi', state: 'Delhi', area: 'Siri Fort',
    venue: 'Siri Fort Sports Complex', address: 'August Kranti Marg', lat: 28.5494, lng: 77.2201,
    day: 2, hour: 20, mins: 90, spots: 8, taken: 5, fee: 19900, level: 'beginner', cadence: 'weekly',
    tags: ['Beginners welcome', 'Court booked', 'Shuttles included'],
    description:
      'Explicitly a beginners\' court. If you have never held a racket properly, this is the right night and I will show you in five minutes. Nobody here is keeping score seriously.',
    agenda: ['20:00 — basics for anyone new', '20:20 — friendly doubles, partners rotate', '21:30 — off court'],
    bring: ['Sports shoes', 'Racket (spares available)'],
  },
  {
    title: 'Winter dinner — eight people, one long table',
    category: 'dinner', host: 4, city: 'Delhi', state: 'Delhi', area: 'Hauz Khas',
    venue: 'Table at Hauz Khas village', address: 'Deer Park side lane', lat: 28.5535, lng: 77.1943,
    day: 4, hour: 20, mins: 150, spots: 8, taken: 7, fee: 39900, level: 'any',
    tags: ['Set menu', 'Eight people', 'Vegetarian option'],
    description:
      'A set menu for eight at a place I have been going to for six years. The fee covers the food. Half the table will be people who came alone the first time, which is exactly the intention.',
    agenda: ['20:00 — arrive, introductions that last one sentence each', '20:20 — food starts arriving', '22:30 — the table decides what happens next'],
    bring: ['Just yourself'],
  },
  {
    title: 'Group study — CA finals, silent room',
    category: 'group-study', host: 9, city: 'Delhi', state: 'Delhi', area: 'Karol Bagh',
    venue: 'Karol Bagh library, second floor', address: 'Ajmal Khan Road', lat: 28.6519, lng: 77.1909,
    day: 3, hour: 14, mins: 240, spots: 10, taken: 6, fee: 9900, level: 'serious',
    tags: ['Silent', 'Four hours', 'Doubt hour at the end'],
    description:
      'Three silent hours, then one hour where the room opens up and anyone can put a doubt on the board. The last hour is why people come back.',
    agenda: ['14:00 — silent block one', '15:30 — ten minutes, stand up, walk', '15:40 — silent block two', '17:00 — doubts on the board, anyone can answer'],
    bring: ['Laptop', 'Notebook & pen'],
  },

  /* ---------------------------------- Pune -------------------------------- */
  {
    title: 'GATE 5am club — the library opens for us',
    category: 'exam-prep', host: 6, city: 'Pune', state: 'Maharashtra', area: 'Kothrud',
    venue: 'Kothrud study centre', address: 'Paud Road', lat: 18.5074, lng: 73.8077,
    day: 1, hour: 5, mins: 180, spots: 8, taken: 5, fee: 9900, level: 'serious', cadence: 'daily',
    tags: ['5am', 'Silent', 'Every weekday'],
    description:
      'Five in the morning is a terrible idea alone and a completely reasonable one with seven other people who also said they would be there. That is the whole mechanism. Three hours, out by eight, day already won.',
    agenda: ['05:00 — doors, no talking from here', '06:30 — fifteen-minute break', '06:45 — second block', '08:00 — breakfast for anyone who wants it'],
    bring: ['Notebook & pen', 'Laptop'],
  },
  {
    title: 'Sunday trek — Sinhagad before the crowd',
    category: 'outdoors', host: 6, city: 'Pune', state: 'Maharashtra', area: 'Sinhagad',
    venue: 'Sinhagad base — Atkarwadi gate', address: 'Sinhagad Ghat Road', lat: 18.3664, lng: 73.7556,
    day: 6, hour: 5, minute: 30, mins: 300, spots: 16, taken: 12, fee: 29900, level: 'beginner',
    tags: ['Sunrise', 'Transport included', 'Breakfast at the top'],
    description:
      'Shared transport from Kothrud at half five, on the trail by six, at the top for sunrise. Two and a half hours up at a pace set by whoever is slowest — that is a promise, not a courtesy.',
    agenda: ['05:30 — pickup at Kothrud', '06:10 — start climbing', '08:00 — top, pithla bhakri, sit down', '09:30 — down, back by 10:30'],
    bring: ['Sports shoes', 'Water bottle'],
  },
  {
    title: 'Architecture students\' long lunch',
    category: 'breakfast-lunch', host: 10, city: 'Pune', state: 'Maharashtra', area: 'Deccan',
    venue: 'Vaishali, Fergusson College Road', address: 'FC Road', lat: 18.5236, lng: 73.8412,
    day: 5, hour: 12, minute: 30, mins: 120, spots: 8, taken: 4, fee: 4900, level: 'any',
    tags: ['Students', 'Cheap', 'Loud'],
    description:
      'Portfolio arguments over sabudana vada. Bring whatever you are working on if you want eyes on it; nobody minds if you just want to eat and listen.',
    agenda: ['12:30 — order, sit, eat', '13:15 — whoever brought work puts it on the table', '14:30 — out before the evening crowd'],
    bring: ['Just yourself'],
  },
  {
    title: 'Beginner lifting — form first, weight never',
    category: 'gym', host: 6, city: 'Pune', state: 'Maharashtra', area: 'Baner',
    venue: 'Baner Strength Room', address: 'Baner Road', lat: 18.5590, lng: 73.7868,
    day: 3, hour: 18, minute: 30, mins: 75, spots: 6, taken: 2, fee: 19900, level: 'beginner', audience: 'women', cadence: 'weekly',
    tags: ['Women only', 'Day pass included', 'Coached'],
    description:
      'A women-only slot for the first eight weeks of lifting, when the gym floor is the most intimidating room in the city. Squat, hinge, press, row — with an empty bar until the movement is right. Day pass is in the fee.',
    agenda: ['18:30 — the four movements, empty bar', '19:00 — add weight only where form held', '19:35 — questions, no time limit'],
    bring: ['Water bottle', 'Sports shoes'],
  },

  /* -------------------------------- Hyderabad ----------------------------- */
  {
    title: 'Box cricket, nine o\'clock, teams picked on the spot',
    category: 'sports', host: 11, city: 'Hyderabad', state: 'Telangana', area: 'Gachibowli',
    venue: 'The Box, Gachibowli', address: 'Financial District Road', lat: 17.4401, lng: 78.3489,
    day: 2, hour: 21, mins: 90, spots: 12, taken: 9, fee: 14900, level: 'any', cadence: 'weekly',
    tags: ['Turf booked', 'Teams on the night', 'Floodlit'],
    description:
      'Twelve people, two teams picked by whoever arrives first, six overs a side. Turf is booked and paid for out of the fee. I have four bats, all of them mediocre, all of them available.',
    agenda: ['21:00 — pick teams', '21:10 — two innings', '22:20 — chai at the gate'],
    bring: ['Sports shoes', 'Water bottle'],
  },
  {
    title: 'Law finals — case-law drilling in pairs',
    category: 'group-study', host: 3, city: 'Hyderabad', state: 'Telangana', area: 'Banjara Hills',
    venue: 'Road No. 12 reading room', address: 'Banjara Hills Road No. 12', lat: 17.4126, lng: 78.4392,
    day: 4, hour: 10, mins: 180, spots: 8, taken: 5, fee: 9900, level: 'serious',
    tags: ['Pairs', 'Case law', 'Phones in the box'],
    description:
      'Pairs drill each other on facts, holding and ratio. Swap partners every forty minutes. It is exhausting and it is the only method that ever moved my marks.',
    agenda: ['10:00 — pair one', '10:40 — swap', '11:20 — swap again', '12:20 — group recap of everything that got missed'],
    bring: ['Notebook & pen', 'Question bank'],
  },
  {
    title: 'Biryani lunch for people new to the city',
    category: 'breakfast-lunch', host: 11, city: 'Hyderabad', state: 'Telangana', area: 'Jubilee Hills',
    venue: 'Shah Ghouse, Jubilee Hills', address: 'Road No. 36', lat: 17.4321, lng: 78.4074,
    day: 5, hour: 13, mins: 105, spots: 10, taken: 6, fee: 9900, level: 'any',
    tags: ['New in town', 'Halal', 'Ten people'],
    description:
      'Specifically for people who moved here in the last six months and have not yet found their people. I have been the new one twice. The food is not the point but it is very much the point.',
    agenda: ['13:00 — meet outside, walk in together', '13:15 — eat', '14:15 — anyone who wants to keep going, keeps going'],
    bring: ['Just yourself'],
  },
  {
    title: 'Evening 5K along the Necklace Road',
    category: 'outdoors', host: 11, city: 'Hyderabad', state: 'Telangana', area: 'Necklace Road',
    venue: 'Necklace Road, People\'s Plaza', address: 'Necklace Road', lat: 17.4239, lng: 78.4738,
    day: 3, hour: 18, minute: 30, mins: 60, spots: 20, taken: 13, fee: 4900, level: 'any', cadence: 'weekly',
    tags: ['5K', 'Two pace groups', 'Free-ish'],
    description:
      'The cheapest thing on VibeClub and the most attended. Two pace groups, a lit path, and a stretch circle at the end that half the group skips.',
    agenda: ['18:30 — warm-up', '18:40 — 5K, two groups', '19:15 — stretch, or leave, no judgement'],
    bring: ['Sports shoes', 'Water bottle'],
  },

  /* --------------------------------- Chennai ------------------------------ */
  {
    title: 'Marina sunrise run — 6K, slow on purpose',
    category: 'outdoors', host: 5, city: 'Chennai', state: 'Tamil Nadu', area: 'Marina',
    venue: 'Marina Beach — lighthouse end', address: 'Kamarajar Salai', lat: 13.0500, lng: 80.2824,
    day: 1, hour: 5, minute: 45, mins: 75, spots: 18, taken: 11, fee: 4900, level: 'beginner', cadence: 'daily',
    tags: ['Sunrise', 'Conversational pace', 'Beginners'],
    description:
      'Conversational pace means you can hold a sentence the whole way. If you cannot, we slow down. Six kilometres along the sand-side path, finishing before the heat makes it a bad idea.',
    agenda: ['05:45 — meet at the lighthouse', '06:00 — 6K out and back', '07:00 — coffee at the stall'],
    bring: ['Sports shoes', 'Water bottle'],
  },
  {
    title: 'Silent co-working — four hours, no meetings',
    category: 'group-study', host: 5, city: 'Chennai', state: 'Tamil Nadu', area: 'Nungambakkam',
    venue: 'Amethyst reading room', address: 'Whites Road', lat: 13.0604, lng: 80.2604,
    day: 2, hour: 10, mins: 240, spots: 10, taken: 3, fee: 14900, level: 'any', cadence: 'weekly',
    tags: ['Silent', 'Wi-Fi', 'Power sockets'],
    description:
      'For anyone whose job is technically remote and practically lonely. Four hours, everyone working on their own thing, absolute silence except for the two scheduled breaks.',
    agenda: ['10:00 — block one', '11:30 — break', '11:45 — block two', '13:15 — optional lunch downstairs'],
    bring: ['Laptop', 'Water bottle'],
  },
  {
    title: 'NEET biology — one system a week',
    category: 'exam-prep', host: 3, city: 'Chennai', state: 'Tamil Nadu', area: 'T. Nagar',
    venue: 'Panagal Park study hall', address: 'Thanikachalam Road', lat: 13.0418, lng: 80.2341,
    day: 4, hour: 17, mins: 150, spots: 12, taken: 8, fee: 9900, level: 'intermediate', cadence: 'weekly',
    tags: ['NCERT', 'Weekly system', 'MCQ drill'],
    description:
      'One body system per week, straight from NCERT, then sixty MCQs against the clock and a walk through every wrong answer. Slow, unglamorous, works.',
    agenda: ['17:00 — this week\'s system, board work', '18:00 — 60 MCQs, timed', '18:40 — every wrong answer, out loud'],
    bring: ['Question bank', 'Notebook & pen'],
  },
  {
    title: 'Tamil conversation hour — absolute beginners',
    category: 'skills', host: 5, city: 'Chennai', state: 'Tamil Nadu', area: 'Besant Nagar',
    venue: 'Elliot\'s Beach — the steps', address: 'Besant Nagar Beach', lat: 12.9986, lng: 80.2707,
    day: 5, hour: 17, minute: 30, mins: 90, spots: 10, taken: 4, fee: 4900, level: 'beginner', language: 'Tamil', cadence: 'weekly',
    tags: ['Language', 'Beginners', 'Outdoors'],
    description:
      'For people who have lived here two years and still cannot order breakfast. Half the group are native speakers who volunteered. Nobody corrects grammar unless you ask them to.',
    agenda: ['17:30 — pair a learner with a speaker', '18:00 — swap pairs', '18:40 — everyone together, one topic'],
    bring: ['Notebook & pen'],
  },

  /* ------------------------- a few more, for depth ------------------------ */
  {
    title: 'Chess ladder — bring a clock if you have one',
    category: 'skills', host: 2, city: 'Bengaluru', state: 'Karnataka', area: 'Jayanagar',
    venue: 'Jayanagar Club annexe', address: '11th Main, 4th Block', lat: 12.9250, lng: 77.5938,
    day: 7, hour: 18, mins: 150, spots: 16, taken: 7, fee: 9900, level: 'any', cadence: 'weekly',
    tags: ['Ladder', '15+10', 'All ratings'],
    description:
      'A running ladder — you play whoever is nearest you on it. Ratings from 600 to 1900 turn up, which sounds unworkable and is in practice the best part.',
    agenda: ['18:00 — pairings from the ladder', '18:10 — three rounds, 15+10', '20:20 — new ladder posted'],
    bring: ['Just yourself'],
  },
  {
    title: 'Leg day, and nobody skips it alone',
    category: 'gym', host: 1, city: 'Mumbai', state: 'Maharashtra', area: 'Powai',
    venue: 'Powai Barbell Club', address: 'Hiranandani Gardens', lat: 19.1197, lng: 72.9051,
    day: 5, hour: 7, mins: 75, spots: 6, taken: 5, fee: 19900, level: 'intermediate', cadence: 'weekly',
    tags: ['Squat & hinge', 'Spotters', 'Day pass included'],
    description:
      'The session everybody moves to tomorrow. Six people, three racks, one written plan. Day pass included in the fee.',
    agenda: ['07:00 — warm-up, together', '07:15 — squats in pairs', '07:50 — hinge and accessories', '08:15 — done, protein, work'],
    bring: ['Water bottle', 'A towel'],
  },
  {
    title: 'Thursday dinner, six strangers, one rule',
    category: 'dinner', host: 0, city: 'Bengaluru', state: 'Karnataka', area: 'Jayanagar',
    venue: 'Address revealed 24 hours before', address: 'Jayanagar 4th Block', lat: 12.9299, lng: 77.5822,
    day: 4, hour: 20, mins: 150, spots: 6, taken: 4, fee: 39900, level: 'any', cadence: 'weekly',
    tags: ['Six strangers', 'Set menu', 'Phones away'],
    description:
      'Six people who have not met, one long table, and the rule that nobody asks what anyone does for a living in the first hour. Food is in the fee. Venue lands in your inbox the day before.',
    agenda: ['20:00 — arrive, one sentence each', '20:15 — food, no phones on the table', '22:30 — whoever is still talking, keeps talking'],
    bring: ['Just yourself'],
  },
];

export const SEED_MEETUPS: Meetup[] = rows.map((r, i) => {
  const startsAt = at(r.day, r.hour, r.minute ?? 0);
  return {
    id: `m${String(i + 1).padStart(3, '0')}`,
    slug: `${slugify(r.title).slice(0, 60)}-${slugify(r.city)}`,
    title: r.title,
    categorySlug: r.category,
    hostId: SEED_USERS[r.host].id,
    description: r.description,
    agenda: r.agenda,
    bring: r.bring,
    venueName: r.venue,
    address: r.address,
    area: r.area,
    city: r.city,
    state: r.state,
    lat: r.lat,
    lng: r.lng,
    startsAt,
    endsAt: plusMinutes(startsAt, r.mins),
    spotsTotal: r.spots,
    spotsTaken: r.taken,
    joinFeeCents: r.fee,
    level: r.level,
    audience: r.audience ?? 'everyone',
    language: r.language ?? 'English',
    cadence: r.cadence ?? 'once',
    coverImage: null,
    tags: r.tags,
    createdAt: daysAgo(30 - (i % 25)),
    rating: 0,
    vouchCount: 0,
  };
});

/* ------------------------------------------------------------------ */
/* Vouches — left after a meetup has actually run                      */
/* ------------------------------------------------------------------ */

const vouchCopy: { rating: number; body: string; highlights: string[] }[] = [
  { rating: 5, body: 'Turned up expecting to feel like the outsider and was handed a task within two minutes. Started exactly on time, ended exactly on time, and I got more done than in the previous three days combined.', highlights: ['Started on time', 'Welcoming to newcomers', 'Would join again'] },
  { rating: 5, body: 'The phones-in-the-box rule sounds gimmicky until you watch eight people actually keep to it for three hours. I have joined four times now and booked the next one before leaving.', highlights: ['Quiet enough to focus', 'Host was organised'] },
  { rating: 4, body: 'Genuinely good, one honest note: we started about twelve minutes late because two people were finding the entrance. Worth pinning better directions. Everything after that was excellent.', highlights: ['Good group energy', 'Would join again'] },
  { rating: 5, body: 'I have been in this city for seven months and this is the first thing that made it feel less like a hotel. Nobody asked what I do for a living, which was a relief.', highlights: ['Welcoming to newcomers', 'Good group energy'] },
  { rating: 4, body: 'Solid session and fairly priced for what is included. The group skews experienced, so if you are brand new, say so at the start — they will happily adjust, but you have to speak up.', highlights: ['Host was organised'] },
  { rating: 5, body: 'The analysis afterwards is worth the fee on its own. I have written mocks alone for a year and learned more in two hours of arguing about them than in any of it.', highlights: ['Host was organised', 'Would join again'] },
  { rating: 3, body: 'Fine, but oversubscribed on the day I went — twelve people for eight spots because of a waitlist mix-up, so it was cramped. The host handled it well and refunded two people on the spot.', highlights: ['Good group energy'] },
  { rating: 5, body: 'Slowest person in the group sets the pace and that is actually enforced, not just said. I have never been dropped, which after two other run groups is not nothing.', highlights: ['Welcoming to newcomers', 'Would join again'] },
  { rating: 5, body: 'Six weeks in a row now. The reason it works is that somebody notices when you do not show up, and that turns out to be the entire difference.', highlights: ['Started on time', 'Would join again'] },
  { rating: 4, body: 'Good energy, well run, and the equipment was all there as promised. Docking one only because parking nearby is genuinely awful — come by metro.', highlights: ['Host was organised', 'Good group energy'] },
  { rating: 5, body: 'I was the only beginner and it never once felt like it. Three separate people quietly adjusted something for me without making a moment of it.', highlights: ['Welcoming to newcomers', 'Quiet enough to focus'] },
  { rating: 5, body: 'Booked it as a one-off to fill a Saturday. Have now been to five and know most of the group by name. Not what I expected from a paid meetup.', highlights: ['Good group energy', 'Would join again'] },
];

const hostReplies = [
  'Fair on the directions — I have added a photo of the entrance to the listing. See you next week.',
  'Thank you. The waitlist bug was on us and both refunds went out the same evening; the cap is hard now.',
  'Glad it landed. Anyone reading this who is unsure: come to the front and say you are new, we will sort you out.',
];

export const SEED_VOUCHES: Vouch[] = SEED_MEETUPS.flatMap((meetup, mi) => {
  // Recurring meetups have run before, so they carry history. One-offs that
  // have not happened yet carry a little less — which is honest.
  const count = meetup.cadence === 'once' ? 2 + (mi % 3) : 4 + (mi % 4);
  return Array.from({ length: count }, (_, vi) => {
    const copy = vouchCopy[(mi * 5 + vi * 3) % vouchCopy.length];
    const author = SEED_USERS[(mi + vi * 4 + 1) % SEED_USERS.length];
    const replies = copy.rating <= 4 && vi === 0;
    return {
      id: `v-${meetup.id}-${vi}`,
      meetupId: meetup.id,
      userId: author.id,
      authorName: author.fullName,
      authorAvatar: author.avatarUrl,
      rating: copy.rating,
      body: copy.body,
      highlights: copy.highlights,
      createdAt: daysAgo(3 + vi * 7 + (mi % 5)),
      hostReply: replies ? hostReplies[mi % hostReplies.length] : null,
      hostReplyAt: replies ? daysAgo(2 + vi * 7 + (mi % 5)) : null,
    };
  });
});

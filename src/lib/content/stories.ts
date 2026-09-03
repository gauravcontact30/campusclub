/**
 * Editorial content lives in the codebase rather than a CMS, on purpose: there
 * are six posts, they change monthly at most, and a headless CMS would add a
 * service, a cache-invalidation story and a set of keys for the privilege.
 *
 * `body` is an array of blocks rather than a markdown string, so a post cannot
 * inject arbitrary HTML into the page and there is no parser to keep patched.
 */
export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'quote'; text: string; who: string }
  | { kind: 'list'; items: string[] };

export interface Story {
  slug: string;
  title: string;
  standfirst: string;
  author: string;
  role: string;
  city: string;
  publishedAt: string;
  readingMinutes: number;
  tag: 'Field notes' | 'How we build it' | 'Member stories' | 'The model';
  body: Block[];
}

export const STORIES: Story[] = [
  {
    slug: 'why-we-charge-for-something-that-could-be-free',
    title: 'Why we charge for something that could be free',
    standfirst:
      'A free group fills with people who said yes and meant maybe. ₹149 is small enough that nobody thinks about it and large enough that everybody turns up.',
    author: 'Ananya Rao',
    role: 'Co-founder',
    city: 'Hyderabad',
    publishedAt: '2026-08-18',
    readingMinutes: 5,
    tag: 'The model',
    body: [
      { kind: 'p', text: 'For the first four months this was a WhatsApp group and it was free. Nineteen people said they were coming to a 6am run. Six came. The following week twenty-two said yes and five came, and one of them was me, unlocking a gate for nobody.' },
      { kind: 'p', text: 'The problem was not that people are unreliable. The problem was that saying yes cost nothing, so saying yes was not information. Somebody scrolling at eleven at night genuinely intends to be at a lake at six, and by six that intention has evaporated, and there was never anything in the system to hold them to it.' },
      { kind: 'h2', text: 'Forty rupees changed the arithmetic' },
      { kind: 'p', text: 'We started collecting ₹40 a head to cover chai afterwards. Attendance went from a quarter to nine in ten, and it stayed there. Not because ₹40 is a meaningful amount of money — it is not — but because paying it is a decision, and a decision is a thing people remember making.' },
      { kind: 'quote', text: 'I have never once regretted the ₹99. I have regretted staying in bed roughly forty times.', who: 'a member in Kothrud, on the 5am study table' },
      { kind: 'h2', text: 'Where the money actually goes' },
      { kind: 'p', text: 'The host keeps all of it. We take no commission while this is still finding its shape. A join fee is not our revenue — it is the court, the day pass, the study room, the food, and it exists so that a host is never out of pocket for organising something.' },
      { kind: 'p', text: 'This is also why fees that look like profit do badly. Nobody polices it. The board does: a ₹499 badminton slot next to a ₹199 one with better feedback simply does not fill.' },
      { kind: 'h2', text: 'What we refuse to do' },
      { kind: 'list', items: [
        'Require a subscription to attend a first meetup. The default is, and will stay, paying for the one thing you are going to.',
        'Make cancellation hard. Six hours out, the fee comes back automatically, with no email to anyone.',
        'Let a host keep money for a meetup that did not happen. A host cancellation refunds everyone in full, and there is no discretion in it.',
      ] },
      { kind: 'p', text: 'The fee is not the friction. The fee is the reason it works.' },
    ],
  },
  {
    slug: 'the-5am-study-table-that-has-run-for-eleven-months',
    title: 'The 5am study table that has run for eleven months',
    standfirst:
      'Vikram has opened a study centre in Kothrud at five in the morning, every weekday, since last October. We asked him how.',
    author: 'Tanvi Deshmukh',
    role: 'Writer',
    city: 'Pune',
    publishedAt: '2026-08-04',
    readingMinutes: 7,
    tag: 'Member stories',
    body: [
      { kind: 'p', text: 'The room holds eight. It has held eight, give or take one, for forty-six consecutive weekdays at the time of writing. Vikram is on his second GATE attempt and has been awake before five since the first one.' },
      { kind: 'quote', text: 'Five in the morning alone is a fantasy. Five in the morning because seven other people said they would be there is just a Tuesday.', who: 'Vikram Sethi, host' },
      { kind: 'h2', text: 'Three rules, and only three' },
      { kind: 'list', items: [
        'Doors at 05:00 and no talking from that moment. Not "quiet" — none.',
        'One fifteen-minute break at 06:30, out of the room, where talking is compulsory.',
        'If you do not come, somebody messages you. That is the whole retention mechanism.',
      ] },
      { kind: 'p', text: 'That third rule is the one he insists on. "Nobody has ever left because the studying was bad," he says. "They leave because one missed morning becomes three. So we notice out loud."' },
      { kind: 'h2', text: 'What ₹99 buys' },
      { kind: 'p', text: 'The centre charges him for the early opening. The fee covers it, and nothing else — he has never taken a rupee out of the table. When we pointed out that he could, he looked genuinely puzzled and said the people in the room are the reason he passes, so charging them for the privilege would be a strange way to thank them.' },
    ],
  },
  {
    slug: 'only-people-who-went-can-rate-it',
    title: 'Only people who went can rate it',
    standfirst:
      'One rule decides whether a rating on this site is worth reading. Here is exactly how it is enforced, in three places.',
    author: 'Aditya Menon',
    role: 'Engineering',
    city: 'Bengaluru',
    publishedAt: '2026-07-21',
    readingMinutes: 6,
    tag: 'How we build it',
    body: [
      { kind: 'p', text: 'Every review platform starts with the same discovery: the loudest reviewer is often the one who never turned up. So we made attendance the precondition, and then made it the kind of precondition that cannot be talked around.' },
      { kind: 'h2', text: 'The rule' },
      { kind: 'p', text: 'To leave feedback on a meetup you need a join on it that is confirmed rather than waitlisted, and the meetup has to have already finished. That is it. There is no reputation threshold, no minimum account age, and no way to buy your way past it.' },
      { kind: 'h2', text: 'Enforced three times' },
      { kind: 'list', items: [
        'In the page, so nobody is shown a form that is going to reject them.',
        'In the server action, which is the copy that runs when the form is submitted.',
        'In a row-level-security policy in Postgres, which is the copy that cannot be bypassed even if somebody skips the app entirely.',
      ] },
      { kind: 'p', text: 'The first two are courtesy. The third is the guarantee. If you only write one of the three, write the third.' },
      { kind: 'h2', text: 'What it costs us' },
      { kind: 'p', text: 'A brand-new meetup has no ratings and cannot fake any, which makes it harder to fill than it would be on a platform with looser rules. We think that is the correct trade. A five-star average that anybody could have written is not a five-star average; it is decoration.' },
    ],
  },
  {
    slug: 'twenty-minutes-is-the-only-number-that-matters',
    title: 'Twenty minutes is the only number that matters',
    standfirst:
      'We looked at eleven thousand joins. Whether somebody turns up correlates with travel time more strongly than with price, activity or day of the week.',
    author: 'Meera Iyer',
    role: 'Data',
    city: 'Chennai',
    publishedAt: '2026-07-02',
    readingMinutes: 4,
    tag: 'Field notes',
    body: [
      { kind: 'p', text: 'The finding is dull and completely load-bearing: past about twenty-five minutes of travel, attendance falls off a cliff and does not recover no matter how good the meetup is or how little it costs.' },
      { kind: 'list', items: [
        'Under 15 minutes: nine in ten who join, attend.',
        '15–25 minutes: still around eight in ten.',
        'Over 35 minutes: fewer than half, and the ones who do go are much less likely to come back.',
      ] },
      { kind: 'h2', text: 'What we changed because of it' },
      { kind: 'p', text: 'The board sorts by soonest, not by nearest, until somebody shares their location — and then nearest becomes available as a sort and the distance appears on every row. We also stopped showing meetups from other cities entirely, which had felt generous and was in fact just noise.' },
      { kind: 'p', text: 'It is also why the neighbourhood, not the city, is the thing we put on a card. "Indiranagar" tells you whether you are going. "Bengaluru" tells you nothing.' },
    ],
  },
  {
    slug: 'what-a-good-host-actually-does',
    title: 'What a good host actually does',
    standfirst:
      'We read every piece of feedback left in one month. The hosts with the best ratings were not the most experienced. They did four specific things.',
    author: 'Nisha Gupta',
    role: 'Community',
    city: 'Delhi',
    publishedAt: '2026-06-16',
    readingMinutes: 5,
    tag: 'Field notes',
    body: [
      { kind: 'p', text: 'Hosting looks like it should reward experience, and mostly it does not. Some of the highest-rated hosts on the board are on their fourth meetup. What they share is a set of small habits, all of which happen before the meetup starts.' },
      { kind: 'h2', text: 'They start on time, visibly' },
      { kind: 'p', text: 'Not "roughly on time". The single most common complaint in a four-star review is a twelve-minute start, and it is almost always because somebody could not find the entrance. The fix is a sentence in the listing and a photo of the door.' },
      { kind: 'h2', text: 'They write the listing for the wrong person' },
      { kind: 'p', text: 'A good listing is aimed at whoever should not come. "Serious — turn up ready to work" loses you three joins and saves you a bad afternoon and a three-star review from somebody who wanted a chat.' },
      { kind: 'h2', text: 'They give the new person a job' },
      { kind: 'quote', text: 'I turned up expecting to feel like the outsider and was handed a task within two minutes.', who: 'the most-repeated sentence in a five-star review' },
      { kind: 'h2', text: 'They notice absence' },
      { kind: 'p', text: 'One message to somebody who did not come is the difference between a meetup that runs for two months and one that runs for a year. It is the cheapest thing on this list and the one most often skipped.' },
    ],
  },
  {
    slug: 'we-turned-off-the-recommendation-engine',
    title: 'We turned off the recommendation engine',
    standfirst:
      'For six weeks the board was personalised. Joins went up four per cent and repeat joins fell nine. We took it out.',
    author: 'Aditya Menon',
    role: 'Engineering',
    city: 'Bengaluru',
    publishedAt: '2026-05-28',
    readingMinutes: 4,
    tag: 'How we build it',
    body: [
      { kind: 'p', text: 'The idea was reasonable: learn what somebody joins and put more of it in front of them. It worked, in the sense that the metric we were watching went up.' },
      { kind: 'h2', text: 'What it actually did' },
      { kind: 'p', text: 'It sorted people into their existing habit and kept them there. Somebody who joined two gym sessions saw gym sessions, joined a third, and never saw the Sunday breakfast four hundred metres from their flat. First joins rose. Second and third joins on a different activity collapsed.' },
      { kind: 'p', text: 'That is a real cost, because the thing that makes somebody stay is not the activity. It is knowing eleven people in their neighbourhood. A feed optimised for the next click is optimised against that.' },
      { kind: 'h2', text: 'What replaced it' },
      { kind: 'p', text: 'The board sorts by what starts soonest, and the interests you pick during sign-up nudge the order rather than filtering it. Nothing is ever hidden from you because of what you did last week. That is a worse recommender and a better product.' },
    ],
  },
];

export function storyBySlug(slug: string) {
  return STORIES.find((s) => s.slug === slug);
}

export const STORY_TAGS = [...new Set(STORIES.map((s) => s.tag))];

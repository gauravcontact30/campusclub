/**
 * Domain model shared by the Supabase adapter and the demo (in-memory) adapter.
 * Keeping one set of types means pages never care which backend answered.
 *
 * The product is a pay-per-join meetup platform: a member creates a meetup
 * (a study session, a gym slot, a dinner), other members nearby pay that
 * meetup's join fee to take one of its spots.
 */

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export interface Category {
  id: string;
  slug: string;
  name: string;
  /** lucide-react icon name, resolved in category-icon.tsx */
  icon: string;
  blurb: string;
  /** Short verb used in copy: "Study together", "Eat together"… */
  verb: string;
  /**
   * The actual things people do under this heading — "Badminton", "Box
   * cricket", "GATE".
   *
   * A category is a shelf label, and a shelf label is not what anybody is
   * looking for: nobody wants "Sports", they want the badminton court on
   * Tuesday. Listing them is what lets somebody recognise their own hobby on a
   * card instead of guessing whether it is filed under Sports or Fitness.
   */
  interests: string[];
}

/**
 * How big a place is, in the only sense this product cares about: how much of
 * a board already exists before we turn up.
 *
 * 1 — a metro. Enough people are already going to things that a stranger's
 *     meetup fills on the day it is posted.
 * 2 — a Tier-2 city. A real city with a student belt, a coaching quarter or an
 *     IT park, where the demand is there but nobody has aggregated it. This is
 *     where the product has to actually work rather than ride density.
 * 3 — a district town. Small enough that a board there has to earn every join.
 *
 * It is a claim about the board, not a census bracket — which is why it lives
 * beside the coordinates rather than being derived from a population number
 * the app does not hold.
 */
export type CityTier = 1 | 2 | 3;

export interface City {
  slug: string;
  name: string;
  state: string;
  blurb: string;
  lat: number;
  lng: number;
  tier: CityTier;
}

/**
 * A real photograph of a real place in a city, and the credit it is owed.
 *
 * Every one of these is freely licensed, and almost every one of those licences
 * requires attribution — so `artist` and `licence` are not decoration, they are
 * the terms on which the picture may be shown at all. See
 * `lib/media/city-photos.ts`.
 */
export interface CityPhoto {
  /** Path under `public` — the file is ours, not a hotlink. */
  src: string;
  /** The Wikipedia article it is the lead image of. */
  article: string;
  artist: string | null;
  licence: string | null;
  licenceUrl: string | null;
  /** The Wikimedia thumbnail the local file was made from. */
  source: string;
}

/**
 * What a place is actually like, for the city directory card.
 *
 * Every field is optional and every one is a list of real, checkable things —
 * a named institution, a market, a stadium that exists. A city we cannot say
 * something true about shows fewer lines rather than plausible-sounding ones:
 * a directory that invents a restaurant is worse than a directory that admits
 * it has not got to that town yet.
 */
export interface CityGuide {
  /** Famous places — what the city is known for. */
  places?: string[];
  /** Where people eat: institutions, food streets, markets. */
  eat?: string[];
  /** Where people stay: named hotels, or the district they cluster in. */
  stay?: string[];
  /** Sports complexes, stadiums and the grounds people actually use. */
  play?: string[];
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export type PassId = 'payg' | 'starter' | 'regular' | 'unlimited';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  city: string;
  bio: string;
  /** Which pass they hold. `payg` = no pass, they pay each join outright. */
  pass: PassId;
  /** Pre-bought joins left on the pass. `unlimited` ignores this. */
  credits: number;
  /** Categories they want in their feed — set during onboarding. */
  interests: string[];
  createdAt: string;
}

/** The public face of a member when they are hosting. */
export interface HostSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  city: string;
  bio: string;
  hostedCount: number;
  rating: number;
  /** Phone/ID verified — shown as a badge, gates nothing in the demo. */
  verified: boolean;
  memberSince: string;
}

/* ------------------------------------------------------------------ */
/* Meetups                                                             */
/* ------------------------------------------------------------------ */

/** How demanding the meetup is, so nobody turns up to the wrong room. */
export type Level = 'any' | 'beginner' | 'intermediate' | 'serious';

/** Who the host is opening the meetup to. */
export type Audience = 'everyone' | 'women' | 'men';

export type Cadence = 'once' | 'weekly' | 'daily';

export interface Meetup {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  hostId: string;
  /** What the meetup is, in the host's words. */
  description: string;
  /** The run of play — three or four beats. */
  agenda: string[];
  /** What to turn up with. */
  bring: string[];
  venueName: string;
  address: string;
  area: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  startsAt: string;
  endsAt: string;
  spotsTotal: number;
  spotsTaken: number;
  /** The whole business model: what one seat at this meetup costs. */
  joinFeeCents: number;
  level: Level;
  audience: Audience;
  language: string;
  cadence: Cadence;
  /** A host-uploaded photo. Null is the norm — cards then draw a generated
   *  cover from the category, which follows the theme instead of fighting it. */
  coverImage: string | null;
  tags: string[];
  createdAt: string;
  /** Set only when a search supplied the visitor's coordinates. */
  distanceKm?: number;
  /** Derived aggregates — never stored, so they cannot drift. */
  rating: number;
  vouchCount: number;
}

/** A meetup with its host resolved — what detail pages and cards render. */
export interface MeetupWithHost extends Meetup {
  host: HostSummary;
}

export type JoinStatus = 'confirmed' | 'waitlisted' | 'cancelled';

export interface Join {
  id: string;
  meetupId: string;
  userId: string;
  status: JoinStatus;
  spotNumber: number;
  /** What they actually paid, in paise. 0 when a pass credit covered it. */
  amountCents: number;
  /** 'credit' when a pass covered the join, otherwise the payment id. */
  paymentId: string | null;
  createdAt: string;
}

export interface JoinWithMeetup extends Join {
  meetup: MeetupWithHost;
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

export type PaymentProvider = 'razorpay' | 'demo';
export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refunded';
/** A join fee, or a pass top-up. */
export type PaymentPurpose = 'join' | 'pass';

export interface Payment {
  id: string;
  userId: string;
  provider: PaymentProvider;
  purpose: PaymentPurpose;
  /** Razorpay order id, or a demo stand-in. */
  orderId: string;
  /** Set once the gateway confirms. */
  gatewayPaymentId: string | null;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  /** The meetup being joined, or null for a pass purchase. */
  meetupId: string | null;
  /** The pass being bought, or null for a join. */
  passId: PassId | null;
  createdAt: string;
}

export interface Pass {
  id: PassId;
  name: string;
  priceCents: number;
  /** Joins included. `null` means unlimited. */
  credits: number | null;
  cadence: string;
  tagline: string;
  perks: string[];
  highlight?: boolean;
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

/** Left after a meetup runs, about how the meetup actually went. */
export interface Vouch {
  id: string;
  meetupId: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  body: string;
  /** Quick chips the attendee ticked — "started on time", "welcoming"… */
  highlights: string[];
  createdAt: string;
  hostReply: string | null;
  hostReplyAt: string | null;
}

/* ------------------------------------------------------------------ */
/* Directory                                                           */
/* ------------------------------------------------------------------ */

/** Roughly what a visit costs: ₹ through ₹₹₹₹. */
export type PriceBand = 1 | 2 | 3 | 4;

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/**
 * Opening times as minutes from local midnight.
 *
 * `close` may exceed 1440 to express a shift running past midnight — a bar
 * open 18:00–02:00 is `{ open: 1080, close: 1560 }` on the day it starts,
 * not two rows. Keeping the interval whole is what lets "open now" be a
 * comparison instead of a special case.
 */
export type OpeningHours = Partial<Record<DayKey, { open: number; close: number }[]>>;

/**
 * A business type — "Restaurants", "Beauty & Spas". Deliberately a different
 * tree from `Category`, which is what people *do* together rather than what a
 * place *is*.
 */
export interface BusinessCategory {
  slug: string;
  name: string;
  /** lucide-react icon name, resolved in category-icon.tsx */
  icon: string;
  /** null for the top-level categories that make up the tile grid. */
  parentSlug: string | null;
  blurb: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  citySlug: string;
  categorySlug: string;
  address: string;
  locality: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  hours: OpeningHours;
  priceBand: PriceBand | null;
  /** The licence credit this row is shown under. Never empty. */
  attribution: string;
  rating: number;
  reviewCount: number;
  /** 0–5: how many of hours, phone, website, address, locality are present. */
  completeness: number;
  claimedBy: string | null;
  createdAt: string;
}

export interface BusinessReview {
  id: string;
  businessId: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  body: string;
  photos: string[];
  createdAt: string;
  ownerReply: string | null;
  ownerReplyAt: string | null;
}

export type BusinessSort = 'recommended' | 'rating' | 'reviewed' | 'nearest' | 'name';

export interface BusinessQuery {
  term?: string;
  city?: string;
  category?: string;
  priceBand?: PriceBand;
  /** Post-filter on the fetched page, not an indexed predicate. */
  openNow?: boolean;
  sort?: BusinessSort;
  page?: number;
  perPage?: number;
  near?: { lat: number; lng: number };
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Time windows the browse page offers. */
export type WhenFilter = 'any' | 'today' | 'tomorrow' | 'weekend' | 'week';

export type MeetupSort = 'soonest' | 'nearest' | 'cheapest' | 'rating' | 'filling';

export interface MeetupQuery {
  term?: string;
  city?: string;
  category?: string;
  /** A `CategoryGroup.id` — filters to every category in that group. Ignored when `category` is also set. */
  group?: string;
  level?: Level;
  when?: WhenFilter;
  /** Upper bound on the join fee, in paise. */
  maxFeeCents?: number;
  /** Only meetups that still have an open spot. */
  hasSpots?: boolean;
  sort?: MeetupSort;
  page?: number;
  perPage?: number;
  /** The visitor's coordinates, when they have shared them. */
  near?: { lat: number; lng: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

/* ------------------------------------------------------------------ */
/* Admin telemetry                                                     */
/* ------------------------------------------------------------------ */

/** What produced the event. */
export type AdminEventKind = 'page' | 'api' | 'auth';

/**
 * How it went. `alert` is not a third status code — it is a success or a
 * failure that someone should look at anyway: a 4xx on a payment route, an
 * unusually slow response, a sign-in that was refused.
 */
export type AdminEventOutcome = 'success' | 'fail' | 'alert';

export interface AdminEvent {
  id: string;
  occurredAt: string;
  kind: AdminEventKind;
  /** Route the event happened on: '/meetups', '/api/chat'. */
  path: string;
  /** What that route is, in words, so the log reads as features not URLs. */
  label: string;
  method: string | null;
  status: number | null;
  durationMs: number | null;
  outcome: AdminEventOutcome;
  /** Error text or a short note. Never a stack trace and never a payload. */
  message: string | null;
  /** Set once somebody is signed in; null for anonymous traffic. */
  userId: string | null;
  userEmail: string | null;
  /**
   * Anonymous, rotating id from a first-party cookie. It is what lets the
   * dashboard say "one person read four pages" rather than "four page views",
   * without knowing anything about who that person is.
   */
  visitorId: string;
  referrer: string | null;
}

/** One visitor's session, rolled up from their events. */
export interface VisitorSession {
  visitorId: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  firstSeen: string;
  lastSeen: string;
  pageViews: number;
  /** Distinct pages, most recent first. */
  path: { path: string; label: string; at: string }[];
  referrer: string | null;
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  message?: string;
  data?: T;
  fieldErrors?: Record<string, string>;
}

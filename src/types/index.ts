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
}

export interface City {
  slug: string;
  name: string;
  state: string;
  blurb: string;
  lat: number;
  lng: number;
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
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Time windows the browse page offers. */
export type WhenFilter = 'any' | 'today' | 'tomorrow' | 'weekend' | 'week';

export type MeetupSort = 'soonest' | 'nearest' | 'cheapest' | 'rating' | 'filling';

export interface MeetupQuery {
  term?: string;
  city?: string;
  category?: string;
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

/**
 * Domain model shared by the Supabase adapter and the demo (in-memory) adapter.
 * Keeping one set of types means pages never care which backend answered.
 */

export type PriceLevel = 1 | 2 | 3 | 4;

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  blurb: string;
}

export interface DayHours {
  /** 24h "09:00" — null/null means closed that day */
  open: string | null;
  close: string | null;
}

/** Monday-first week */
export type WeekHours = [DayHours, DayHours, DayHours, DayHours, DayHours, DayHours, DayHours];

export interface Business {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  tags: string[];
  description: string;
  phone: string;
  website: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  lat: number;
  lng: number;
  priceLevel: PriceLevel;
  coverImage: string;
  images: string[];
  hours: WeekHours;
  amenities: string[];
  ownerId: string | null;
  isClaimed: boolean;
  createdAt: string;
  /** Derived aggregates (view / computed) */
  rating: number;
  reviewCount: number;
  /** Set only when a search supplied the visitor's coordinates. */
  distanceKm?: number;
}

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  title: string;
  body: string;
  photos: string[];
  helpfulCount: number;
  createdAt: string;
  /** A public reply from the verified owner of the business. */
  ownerResponse: string | null;
  ownerResponseAt: string | null;
}

export interface BusinessClaim {
  id: string;
  businessId: string;
  userId: string;
  role: string;
  contactEmail: string;
  phone: string;
  note: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  city: string;
  bio: string;
  plan: SubscriptionPlanId;
  createdAt: string;
}

export interface DinnerEvent {
  id: string;
  city: string;
  neighborhood: string;
  venueName: string;
  venueRevealAt: string;
  startsAt: string;
  seatsTotal: number;
  seatsTaken: number;
  priceCents: number;
  language: string;
  vibe: string;
  coverImage: string;
  hostNotes: string;
}

export type BookingStatus = 'confirmed' | 'waitlisted' | 'cancelled';

export interface DinnerBooking {
  id: string;
  eventId: string;
  userId: string;
  status: BookingStatus;
  seatNumber: number;
  createdAt: string;
}

export interface QuizAnswers {
  [questionId: string]: string;
}

export type SubscriptionPlanId = 'free' | 'monthly' | 'quarterly' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceCents: number;
  cadence: string;
  tagline: string;
  perks: string[];
  highlight?: boolean;
}

export interface BusinessQuery {
  term?: string;
  city?: string;
  category?: string;
  price?: PriceLevel[];
  minRating?: number;
  openNow?: boolean;
  sort?: 'recommended' | 'rating' | 'reviews' | 'price_asc' | 'price_desc' | 'distance';
  page?: number;
  perPage?: number;
  /** The visitor's coordinates, when they have shared them. Enables distance sorting. */
  near?: { lat: number; lng: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  message?: string;
  data?: T;
  fieldErrors?: Record<string, string>;
}

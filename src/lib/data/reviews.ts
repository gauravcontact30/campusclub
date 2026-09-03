import type { Review } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db, nextId } from './store';

type ReviewRow = Record<string, unknown>;

function fromRow(row: ReviewRow): Review {
  const profile = (row.profiles ?? {}) as { full_name?: string; avatar_url?: string | null };
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    userId: String(row.user_id),
    authorName: profile.full_name ?? 'VibeClub member',
    authorAvatar: profile.avatar_url ?? null,
    rating: Number(row.rating),
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    photos: (row.photos as string[]) ?? [],
    helpfulCount: Number(row.helpful_count ?? 0),
    createdAt: String(row.created_at),
    ownerResponse: (row.owner_response as string | null) ?? null,
    ownerResponseAt: (row.owner_response_at as string | null) ?? null,
  };
}

export type ReviewSort = 'recent' | 'helpful' | 'high' | 'low';

export async function getReviews(businessId: string, sort: ReviewSort = 'recent'): Promise<Review[]> {
  let items: Review[];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('business_id', businessId);
    if (error) throw new Error(error.message);
    items = (data ?? []).map(fromRow);
  } else {
    items = db().reviews.filter((r) => r.businessId === businessId).map((r) => ({ ...r }));
  }

  const sorters: Record<ReviewSort, (a: Review, b: Review) => number> = {
    recent: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    helpful: (a, b) => b.helpfulCount - a.helpfulCount,
    high: (a, b) => b.rating - a.rating,
    low: (a, b) => a.rating - b.rating,
  };
  return items.sort(sorters[sort]);
}

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase.from('reviews').select('*, profiles(full_name, avatar_url)').eq('user_id', userId);
    return (data ?? []).map(fromRow);
  }
  return db().reviews.filter((r) => r.userId === userId);
}

export interface NewReviewInput {
  businessId: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  title: string;
  body: string;
}

export async function upsertReview(input: NewReviewInput): Promise<Review> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('reviews')
        .upsert(
          {
            business_id: input.businessId,
            user_id: input.userId,
            rating: input.rating,
            title: input.title,
            body: input.body,
          },
          { onConflict: 'business_id,user_id' },
        )
        .select('*, profiles(full_name, avatar_url)')
        .single();
      if (error) throw new Error(error.message);
      return fromRow(data);
    }
  }

  const store = db();
  const existing = store.reviews.find((r) => r.businessId === input.businessId && r.userId === input.userId);
  if (existing) {
    Object.assign(existing, {
      rating: input.rating,
      title: input.title,
      body: input.body,
      createdAt: new Date().toISOString(),
    });
    return existing;
  }
  const review: Review = {
    id: nextId('r'),
    businessId: input.businessId,
    userId: input.userId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    rating: input.rating,
    title: input.title,
    body: input.body,
    photos: [],
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
    ownerResponse: null,
    ownerResponseAt: null,
  };
  store.reviews.unshift(review);
  return review;
}

export async function deleteReview(reviewId: string, userId: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.from('reviews').delete().eq('id', reviewId).eq('user_id', userId);
      return;
    }
  }
  const store = db();
  store.reviews = store.reviews.filter((r) => !(r.id === reviewId && r.userId === userId));
}

/** Returns the new helpful count. Voting twice removes the vote. */
export async function toggleHelpful(reviewId: string, userId: string): Promise<number> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.rpc('toggle_review_helpful', { p_review_id: reviewId, p_user_id: userId });
      return Number(data ?? 0);
    }
  }
  const store = db();
  const review = store.reviews.find((r) => r.id === reviewId);
  if (!review) return 0;
  const idx = store.helpfulVotes.findIndex((v) => v.reviewId === reviewId && v.userId === userId);
  if (idx >= 0) {
    store.helpfulVotes.splice(idx, 1);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    store.helpfulVotes.push({ reviewId, userId });
    review.helpfulCount += 1;
  }
  return review.helpfulCount;
}

export async function getReview(reviewId: string): Promise<Review | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('id', reviewId)
      .maybeSingle();
    return data ? fromRow(data) : null;
  }
  return db().reviews.find((r) => r.id === reviewId) ?? null;
}

/**
 * Publishes (or, with `null`, withdraws) the owner's public reply.
 * Callers must have already established that the user owns the business —
 * RLS enforces the same rule on the Supabase side.
 */
export async function setOwnerResponse(reviewId: string, body: string | null): Promise<Review | null> {
  const respondedAt = body ? new Date().toISOString() : null;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    // A security-definer RPC, so the ownership check lives next to the data.
    const { error } = await supabase.rpc('set_owner_response', { p_review_id: reviewId, p_body: body });
    if (error) throw new Error(error.message);
    return getReview(reviewId);
  }

  const review = db().reviews.find((r) => r.id === reviewId);
  if (!review) return null;
  review.ownerResponse = body;
  review.ownerResponseAt = respondedAt;
  return review;
}

export function ratingBreakdown(reviews: Review[]) {
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const total = reviews.length || 1;
  return buckets.map((b) => ({ ...b, percent: Math.round((b.count / total) * 100) }));
}

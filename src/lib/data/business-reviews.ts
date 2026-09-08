import type { BusinessReview } from '@/types';
import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db, nextId, refreshBusinessRating } from './store';

type Row = Record<string, unknown>;

function fromRow(row: Row): BusinessReview {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    userId: String(row.user_id),
    authorName: String(row.author_name ?? 'A CampusClub member'),
    authorAvatar: (row.author_avatar as string | null) ?? null,
    rating: Number(row.rating ?? 0),
    body: String(row.body ?? ''),
    photos: (row.photos as string[]) ?? [],
    createdAt: String(row.created_at),
    ownerReply: (row.owner_reply as string | null) ?? null,
    ownerReplyAt: (row.owner_reply_at as string | null) ?? null,
  };
}

export type BusinessReviewSort = 'recent' | 'rating';

export async function getBusinessReviews(
  businessId: string,
  sort: BusinessReviewSort = 'recent',
): Promise<BusinessReview[]> {
  let items: BusinessReview[];

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from('business_reviews_with_author')
      .select('*')
      .eq('business_id', businessId);
    items = (data ?? []).map(fromRow);
  } else {
    items = db().businessReviews.filter((r) => r.businessId === businessId);
  }

  return sort === 'rating'
    ? [...items].sort((a, b) => b.rating - a.rating)
    : [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export class AlreadyReviewedError extends Error {
  constructor() {
    super('You have already reviewed this place.');
    this.name = 'AlreadyReviewedError';
  }
}

export async function addBusinessReview(input: {
  businessId: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  body: string;
}): Promise<BusinessReview> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error('Database unavailable.');
    const { data, error } = await supabase
      .from('business_reviews')
      .insert({
        business_id: input.businessId,
        user_id: input.userId,
        rating: input.rating,
        body: input.body,
      })
      .select('*')
      .single();

    // 23505 is unique_violation — one review per person per place. Surfacing
    // it as a sentence rather than a 500 is the whole point of catching it.
    if (error?.code === '23505') throw new AlreadyReviewedError();
    if (error) throw new Error(error.message);
    return fromRow({ ...data, author_name: input.authorName, author_avatar: input.authorAvatar });
  }

  const store = db();
  if (store.businessReviews.some((r) => r.businessId === input.businessId && r.userId === input.userId)) {
    throw new AlreadyReviewedError();
  }

  const review: BusinessReview = {
    id: nextId('br'),
    businessId: input.businessId,
    userId: input.userId,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    rating: input.rating,
    body: input.body,
    photos: [],
    createdAt: new Date().toISOString(),
    ownerReply: null,
    ownerReplyAt: null,
  };
  store.businessReviews.unshift(review);
  refreshBusinessRating(input.businessId);
  return review;
}

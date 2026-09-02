'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { toggleHelpful, upsertReview, deleteReview, getReview, setOwnerResponse } from '@/lib/data/reviews';
import { getBusinessBySlug } from '@/lib/data/businesses';
import { ownerResponseSchema, reviewSchema } from '@/lib/validators';
import type { ActionResult } from '@/types';

/**
 * Owner replies are gated on ownership of the business the review belongs to —
 * checked here and again by row-level security on the Supabase side.
 */
async function assertOwnsReview(reviewId: string, slug: string) {
  const [user, business, review] = await Promise.all([
    getCurrentUser(),
    getBusinessBySlug(slug),
    getReview(reviewId),
  ]);

  if (!user) return { error: 'Sign in first.' as const };
  if (!business || !review || review.businessId !== business.id) {
    return { error: 'That review no longer exists.' as const };
  }
  if (business.ownerId !== user.id) {
    return { error: 'Only the verified owner of this listing can reply.' as const };
  }
  return { user, business, review };
}

export async function submitReviewAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  const slug = String(formData.get('slug') ?? '');
  if (!user) return { ok: false, message: 'Sign in to post a review.' };

  const parsed = reviewSchema.safeParse({
    rating: formData.get('rating'),
    title: formData.get('title'),
    body: formData.get('body'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
    };
  }

  const business = await getBusinessBySlug(slug);
  if (!business) return { ok: false, message: 'That business no longer exists.' };

  await upsertReview({
    businessId: business.id,
    userId: user.id,
    authorName: user.fullName,
    authorAvatar: user.avatarUrl,
    ...parsed.data,
  });

  revalidatePath(`/businesses/${slug}`);
  revalidatePath('/businesses');
  revalidatePath('/profile');
  return { ok: true, message: 'Your review is live. Thanks for the detail.' };
}

export async function toggleHelpfulAction(reviewId: string, slug: string): Promise<ActionResult<number>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to vote on reviews.' };

  const count = await toggleHelpful(reviewId, user.id);
  revalidatePath(`/businesses/${slug}`);
  return { ok: true, data: count };
}

export async function deleteReviewAction(reviewId: string, slug: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in first.' };

  await deleteReview(reviewId, user.id);
  revalidatePath(`/businesses/${slug}`);
  revalidatePath('/profile');
  return { ok: true, message: 'Review removed.' };
}


export async function respondToReviewAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const reviewId = String(formData.get('reviewId') ?? '');
  const slug = String(formData.get('slug') ?? '');

  const context = await assertOwnsReview(reviewId, slug);
  if ('error' in context) return { ok: false, message: context.error };

  const parsed = ownerResponseSchema.safeParse({ body: formData.get('body') });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
    };
  }

  await setOwnerResponse(reviewId, parsed.data.body);
  revalidatePath(`/businesses/${slug}`);
  return { ok: true, message: 'Your reply is public.' };
}

export async function withdrawResponseAction(reviewId: string, slug: string): Promise<ActionResult> {
  const context = await assertOwnsReview(reviewId, slug);
  if ('error' in context) return { ok: false, message: context.error };

  await setOwnerResponse(reviewId, null);
  revalidatePath(`/businesses/${slug}`);
  return { ok: true, message: 'Reply withdrawn.' };
}

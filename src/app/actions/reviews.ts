'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { toggleHelpful, upsertReview, deleteReview } from '@/lib/data/reviews';
import { getBusinessBySlug } from '@/lib/data/businesses';
import { reviewSchema } from '@/lib/validators';
import type { ActionResult } from '@/types';

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

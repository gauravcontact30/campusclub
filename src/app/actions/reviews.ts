'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getBusinessById } from '@/lib/data/businesses';
import { AlreadyReviewedError, addBusinessReview } from '@/lib/data/business-reviews';
import { recordEvent } from '@/lib/admin/events';
import { businessReviewSchema } from '@/lib/validators';
import { fieldErrors } from '@/lib/form';
import type { ActionResult } from '@/types';

/**
 * Writing a review on a directory listing.
 *
 * Unlike `addVouchAction` there is no attendance gate: nobody books a chemist
 * through CampusClub, so requiring a join row would mean the directory never
 * accumulated a single review. The guards that remain are a signed-in author
 * and one review per person per place, which the unique index enforces.
 */
export async function addBusinessReviewAction(
  businessId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to write a review.' };

  const business = await getBusinessById(businessId);
  if (!business) return { ok: false, message: 'That listing no longer exists.' };

  const parsed = businessReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  try {
    await addBusinessReview({
      businessId: business.id,
      userId: user.id,
      authorName: user.fullName,
      authorAvatar: user.avatarUrl,
      ...parsed.data,
    });
  } catch (error) {
    if (error instanceof AlreadyReviewedError) return { ok: false, message: error.message };
    throw error;
  }

  // A public directory with reviews is a spam target, and this milestone ships
  // only the cheap guards. Logging every write is what makes a bad pattern
  // visible in the admin dashboard before there is any moderation tooling.
  // `recordEvent` never throws, so this cannot break a successful review.
  await recordEvent({
    kind: 'api',
    path: `/places/${business.slug}`,
    label: 'Write a review',
    outcome: 'success',
    userId: user.id,
    // No anonymous reviewer exists — the sign-in gate above guarantees it —
    // so the author's own id is the visitor id.
    visitorId: user.id,
  });

  revalidatePath(`/places/${business.slug}`);
  redirect(`/places/${business.slug}#reviews`);
}

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { cancelMeetup, createMeetup } from '@/lib/data/meetups';
import { meetupSchema } from '@/lib/validators';
import { fieldErrors } from '@/lib/form';
import type { ActionResult, Audience, Cadence, Level } from '@/types';

/** Repeated form fields arrive as several entries under the same name. */
function list(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((v) => String(v).trim())
    .filter(Boolean);
}

export async function createMeetupAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to host a meetup.' };

  const parsed = meetupSchema.safeParse({
    ...Object.fromEntries(formData),
    agenda: list(formData, 'agenda'),
    bring: list(formData, 'bring'),
    tags: list(formData, 'tags'),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const meetup = await createMeetup(user.id, {
    ...parsed.data,
    level: parsed.data.level as Level,
    audience: parsed.data.audience as Audience,
    cadence: parsed.data.cadence as Cadence,
  });

  revalidatePath('/meetups');
  revalidatePath('/my-meetups');
  revalidatePath('/');
  redirect(`/meetups/${meetup.slug}`);
}

export async function cancelMeetupAction(meetupId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in first.' };

  const removed = await cancelMeetup(user.id, meetupId);
  if (!removed) return { ok: false, message: 'That is not yours to cancel.' };

  revalidatePath('/meetups');
  revalidatePath('/my-meetups');
  return { ok: true, message: 'Meetup cancelled. Everyone who joined has been refunded.' };
}

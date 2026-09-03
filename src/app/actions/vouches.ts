'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getMeetupById } from '@/lib/data/meetups';
import { hasAttended } from '@/lib/data/joins';
import { addVouch, replyToVouch } from '@/lib/data/vouches';
import { hostReplySchema, vouchSchema } from '@/lib/validators';
import { fieldErrors } from '@/lib/form';
import type { ActionResult } from '@/types';

export async function addVouchAction(
  meetupId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to leave feedback.' };

  const meetup = await getMeetupById(meetupId);
  if (!meetup) return { ok: false, message: 'That meetup no longer exists.' };

  // Only people who actually turned up get to say how it went. This is the
  // whole reason the ratings on this site are worth reading.
  if (!(await hasAttended(user.id, meetupId))) {
    return { ok: false, message: 'Only people who went can leave feedback on a meetup.' };
  }

  const parsed = vouchSchema.safeParse({
    ...Object.fromEntries(formData),
    highlights: formData.getAll('highlights').map(String),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  await addVouch({
    meetupId,
    userId: user.id,
    authorName: user.fullName,
    authorAvatar: user.avatarUrl,
    ...parsed.data,
  });

  revalidatePath(`/meetups/${meetup.slug}`);
  redirect(`/meetups/${meetup.slug}#feedback`);
}

export async function replyToVouchAction(
  vouchId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in first.' };

  const parsed = hostReplySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const replied = await replyToVouch(user.id, vouchId, parsed.data.body);
  if (!replied) return { ok: false, message: 'Only the host of that meetup can reply.' };

  revalidatePath('/my-meetups');
  return { ok: true, message: 'Reply posted.' };
}

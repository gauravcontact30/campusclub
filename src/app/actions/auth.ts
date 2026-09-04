'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser, signIn, signOut, signUp, updateProfile } from '@/lib/auth/session';
import { profileSchema, signInSchema, signUpSchema } from '@/lib/validators';
import { CATEGORY_SLUGS } from '@/lib/constants';
import { fieldErrors } from '@/lib/form';
import type { ActionResult } from '@/types';

export async function signInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const result = await signIn(parsed.data.email, parsed.data.password);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath('/', 'layout');
  redirect(String(formData.get('next') ?? '/'));
}

export async function signUpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const result = await signUp(parsed.data);
  if (!result.ok) return { ok: false, message: result.message };

  // With "Confirm email" on there is no session yet, so redirecting would drop
  // a signed-out visitor onto a members-only page and look like a failed
  // sign-up. Tell them to go and click the link instead.
  if (result.needsEmailConfirmation) {
    return {
      ok: true,
      message: `Account created. Check ${parsed.data.email} for a confirmation link, then sign in.`,
    };
  }

  revalidatePath('/', 'layout');
  // Straight into picking interests — the feed is much better with them, and
  // this is the one moment a new member is willing to answer four questions.
  redirect(String(formData.get('next') ?? '/profile/interests'));
}

export async function signOutAction() {
  await signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function updateProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to update your profile.' };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const result = await updateProfile(user.id, parsed.data);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath('/profile');
  return { ok: true, message: 'Profile updated.' };
}

export async function saveInterestsAction(interests: string[]): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in first.' };

  // Never trust a client list of slugs — anything not in the catalogue is dropped.
  const clean = interests.filter((slug) => CATEGORY_SLUGS.includes(slug)).slice(0, 8);
  const result = await updateProfile(user.id, { interests: clean });
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Saved.' };
}

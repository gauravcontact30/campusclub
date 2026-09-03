'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { toggleSave } from '@/lib/data/saves';
import type { ActionResult } from '@/types';

export async function toggleSaveAction(meetupId: string): Promise<ActionResult<{ saved: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to save meetups.' };

  const saved = await toggleSave(user.id, meetupId);
  revalidatePath('/saved');
  return { ok: true, data: { saved } };
}

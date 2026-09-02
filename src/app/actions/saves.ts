'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { toggleSave } from '@/lib/data/saves';
import type { ActionResult } from '@/types';

export async function toggleSaveAction(businessId: string): Promise<ActionResult<boolean>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to save places.' };

  const saved = await toggleSave(user.id, businessId);
  revalidatePath('/saved');
  return { ok: true, data: saved, message: saved ? 'Saved to your list.' : 'Removed from your list.' };
}

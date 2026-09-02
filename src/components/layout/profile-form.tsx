'use client';

import { useActionState, useEffect } from 'react';
import { updateProfileAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { useUiStore } from '@/store/ui-store';
import type { ActionResult, UserProfile } from '@/types';

export function ProfileForm({ user }: { user: UserProfile }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(updateProfileAction, null);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    if (state?.message) pushToast({ title: state.message, tone: state.ok ? 'success' : 'error' });
  }, [state, pushToast]);

  return (
    <form action={formAction} className="surface-card space-y-5 p-6">
      <h2 className="font-display text-xl font-semibold">Your details</h2>

      <Field label="Name" htmlFor="fullName" error={state?.fieldErrors?.fullName}>
        <Input id="fullName" name="fullName" defaultValue={user.fullName} />
      </Field>

      <Field label="City" htmlFor="profile-city" error={state?.fieldErrors?.city}>
        <Input id="profile-city" name="city" defaultValue={user.city} />
      </Field>

      <Field label="Bio" htmlFor="bio" hint="Shown to nobody but you — it just helps us seat you." error={state?.fieldErrors?.bio}>
        <Textarea id="bio" name="bio" defaultValue={user.bio} className="min-h-[100px]" maxLength={280} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}

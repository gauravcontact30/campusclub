'use client';

import { useActionState, useEffect } from 'react';
import { claimBusinessAction } from '@/app/actions/businesses';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { useUiStore } from '@/store/ui-store';
import { OWNER_ROLES } from '@/lib/constants';
import type { ActionResult } from '@/types';

export function ClaimForm({ slug, businessName }: { slug: string; businessName: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(claimBusinessAction, null);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    if (state && !state.ok && state.message) pushToast({ title: state.message, tone: 'error' });
  }, [state, pushToast]);

  return (
    <form action={formAction} className="surface-card space-y-5 p-6 sm:p-8">
      <input type="hidden" name="slug" value={slug} />

      <div>
        <h2 className="font-display text-xl font-semibold">Claim {businessName}</h2>
        <p className="mt-1 text-sm text-content/60">
          Claiming is instant while we are in beta. We spot-check by phone afterwards, and a disputed claim is reversed
          within one working day.
        </p>
      </div>

      <Field label="Your role" htmlFor="role" error={state?.fieldErrors?.role}>
        <Select id="role" name="role" defaultValue="" required>
          <option value="" disabled>
            Choose one
          </option>
          {OWNER_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Work email"
          htmlFor="contactEmail"
          hint="Ideally on the business domain."
          error={state?.fieldErrors?.contactEmail}
        >
          <Input id="contactEmail" name="contactEmail" type="email" placeholder="you@yourbusiness.com" required />
        </Field>

        <Field label="Phone" htmlFor="phone" hint="The number we ring to verify." error={state?.fieldErrors?.phone}>
          <Input id="phone" name="phone" placeholder="+91 80 4123 8890" required />
        </Field>
      </div>

      <Field label="Anything we should know?" htmlFor="note" hint="Optional." error={state?.fieldErrors?.note}>
        <Textarea
          id="note"
          name="note"
          className="min-h-[100px]"
          maxLength={400}
          placeholder="We changed hands in March and the old hours are wrong…"
        />
      </Field>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Claiming…' : 'Claim this listing'}
      </Button>
    </form>
  );
}

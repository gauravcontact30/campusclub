'use client';

import { useActionState, useEffect, useState } from 'react';
import { addVouchAction } from '@/app/actions/vouches';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { RatingInput } from '@/components/ui/rating-blocks';
import { useUiStore } from '@/store/ui-store';
import { VOUCH_HIGHLIGHTS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ActionResult } from '@/types';

export function VouchForm({ meetupId }: { meetupId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    addVouchAction.bind(null, meetupId),
    null,
  );
  const [highlights, setHighlights] = useState<string[]>([]);
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    if (state && !state.ok && state.message) pushToast({ title: state.message, tone: 'error' });
  }, [state, pushToast]);

  return (
    <form action={formAction} className="surface-card space-y-6 p-6 sm:p-8">
      <Field label="How was it?" error={state?.fieldErrors?.rating}>
        <RatingInput name="rating" />
      </Field>

      <fieldset>
        <legend className="mb-2.5 block text-sm font-semibold text-content">What stood out?</legend>
        <div className="flex flex-wrap gap-2">
          {VOUCH_HIGHLIGHTS.map((item) => {
            const on = highlights.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => setHighlights(on ? highlights.filter((h) => h !== item) : [...highlights, item])}
                aria-pressed={on}
                className={cn(
                  'rounded-full border px-3.5 py-2 text-sm transition-colors',
                  on
                    ? 'border-brand bg-brand/15 text-brand-700'
                    : 'border-content/15 text-content/75 hover:border-content/40',
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
        {highlights.map((h) => (
          <input key={h} type="hidden" name="highlights" value={h} />
        ))}
      </fieldset>

      <Field
        label="What happened?"
        htmlFor="body"
        hint="Specifics help the next person decide. Did it start on time? Was the group welcoming? Was anything not as listed?"
        error={state?.fieldErrors?.body}
      >
        <Textarea id="body" name="body" required minLength={40} />
      </Field>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Posting…' : 'Post feedback'}
      </Button>
    </form>
  );
}

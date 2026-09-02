'use client';

import { useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { submitReviewAction } from '@/app/actions/reviews';
import { RatingInput } from '@/components/ui/rating-stars';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { useUiStore } from '@/store/ui-store';
import type { ActionResult, Review } from '@/types';

export function ReviewForm({
  slug,
  businessName,
  signedIn,
  existing,
}: {
  slug: string;
  businessName: string;
  signedIn: boolean;
  existing?: Review | null;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(submitReviewAction, null);
  const pushToast = useUiStore((s) => s.pushToast);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      pushToast({ title: state.message ?? 'Review posted.', tone: 'success' });
      if (!existing) formRef.current?.reset();
    } else if (state.message) {
      pushToast({ title: state.message, tone: 'error' });
    }
  }, [state, pushToast, existing]);

  if (!signedIn) {
    return (
      <div className="surface-card flex flex-col items-start gap-3 p-6">
        <h3 className="font-display text-xl font-semibold">Been to {businessName}?</h3>
        <p className="text-sm text-content/65">
          Sign in to leave a review. One review per person, editable whenever you change your mind.
        </p>
        <Link
          href={`/login?next=/businesses/${slug}`}
          className="inline-flex h-11 items-center rounded-full bg-ember px-5 text-sm font-semibold text-content hover:bg-ember-600"
        >
          Sign in to review
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="surface-card space-y-5 p-6">
      <input type="hidden" name="slug" value={slug} />

      <div>
        <h3 className="font-display text-xl font-semibold">
          {existing ? 'Update your review' : `Review ${businessName}`}
        </h3>
        <p className="mt-1 text-sm text-content/60">
          Be specific — what you ordered, how long you waited, whether you would go back.
        </p>
      </div>

      <Field label="Your rating" error={state?.fieldErrors?.rating}>
        <RatingInput name="rating" defaultValue={existing?.rating ?? 0} />
      </Field>

      <Field label="Headline" htmlFor="review-title" error={state?.fieldErrors?.title}>
        <Input
          id="review-title"
          name="title"
          defaultValue={existing?.title}
          placeholder="Worth the queue on a Tuesday"
          maxLength={90}
        />
      </Field>

      <Field label="Your review" htmlFor="review-body" hint="Minimum 40 characters." error={state?.fieldErrors?.body}>
        <Textarea
          id="review-body"
          name="body"
          defaultValue={existing?.body}
          placeholder="Tell people what actually happened…"
        />
      </Field>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? 'Posting…' : existing ? 'Update review' : 'Post review'}
      </Button>
    </form>
  );
}

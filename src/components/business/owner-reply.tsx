'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { MessageSquareReply, Store, Trash2 } from 'lucide-react';
import { respondToReviewAction, withdrawResponseAction } from '@/app/actions/reviews';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { useUiStore } from '@/store/ui-store';
import { relativeTime } from '@/lib/utils';
import type { ActionResult, Review } from '@/types';

/**
 * The owner's public right of reply. Visible to everyone once published; the
 * compose box only renders for the verified owner of the listing.
 */
export function OwnerReply({
  review,
  slug,
  businessName,
  canRespond,
}: {
  review: Review;
  slug: string;
  businessName: string;
  canRespond: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(respondToReviewAction, null);
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState(review.ownerResponse);
  const [respondedAt, setRespondedAt] = useState(review.ownerResponseAt);
  const [withdrawing, startWithdraw] = useTransition();
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      pushToast({ title: state.message ?? 'Reply published.', tone: 'success' });
      setOpen(false);
    } else if (state.message) {
      pushToast({ title: state.message, tone: 'error' });
    }
  }, [state, pushToast]);

  // The server action revalidates the page; mirror it locally for instant feedback.
  useEffect(() => {
    setResponse(review.ownerResponse);
    setRespondedAt(review.ownerResponseAt);
  }, [review.ownerResponse, review.ownerResponseAt]);

  function withdraw() {
    startWithdraw(async () => {
      const result = await withdrawResponseAction(review.id, slug);
      pushToast({
        title: result.message ?? (result.ok ? 'Reply withdrawn.' : 'Could not withdraw'),
        tone: result.ok ? 'success' : 'error',
      });
      if (result.ok) {
        setResponse(null);
        setRespondedAt(null);
      }
    });
  }

  if (response) {
    return (
      <div className="mt-4 rounded-2xl border-l-2 border-rouge bg-canvas/[0.04] p-4">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Store size={15} className="text-rouge" />
          Response from {businessName}
          {respondedAt && <span className="font-normal text-xs text-content/55">{relativeTime(respondedAt)}</span>}
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-content/75">{response}</p>

        {canRespond && (
          <div className="mt-3 flex gap-3">
            <button onClick={() => setOpen((o) => !o)} className="text-xs font-semibold text-rouge-700 hover:underline">
              Edit reply
            </button>
            <button
              onClick={withdraw}
              disabled={withdrawing}
              className="inline-flex items-center gap-1 text-xs font-semibold text-content/55 hover:text-rouge"
            >
              <Trash2 size={12} /> Withdraw
            </button>
          </div>
        )}

        {canRespond && open && <ComposeForm />}
      </div>
    );
  }

  if (!canRespond) return null;

  return (
    <div className="mt-4">
      {open ? (
        <ComposeForm />
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-content/15 px-4 py-2 text-xs font-semibold hover:border-content/45"
        >
          <MessageSquareReply size={14} />
          Respond as the owner
        </button>
      )}
    </div>
  );

  function ComposeForm() {
    return (
      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="reviewId" value={review.id} />
        <input type="hidden" name="slug" value={slug} />

        <Field
          label="Your public reply"
          htmlFor={`reply-${review.id}`}
          hint="Everyone reading this review will see it, under your business name."
          error={state?.fieldErrors?.body}
        >
          <Textarea
            id={`reply-${review.id}`}
            name="body"
            defaultValue={response ?? ''}
            placeholder="Thanks for the detail — here is what we have changed since…"
            className="min-h-[110px]"
          />
        </Field>

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? 'Publishing…' : response ? 'Update reply' : 'Publish reply'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }
}

'use client';

import { useState, useTransition } from 'react';
import { ThumbsUp, Trash2 } from 'lucide-react';
import type { Review } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { RatingStars } from '@/components/ui/rating-stars';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { toggleHelpfulAction, deleteReviewAction } from '@/app/actions/reviews';
import { OwnerReply } from './owner-reply';
import { useUiStore } from '@/store/ui-store';
import { relativeTime } from '@/lib/utils';

export function ReviewCard({
  review,
  slug,
  businessName,
  isOwn = false,
  canRespond = false,
}: {
  review: Review;
  slug: string;
  businessName: string;
  isOwn?: boolean;
  /** True when the signed-in user is the verified owner of this listing. */
  canRespond?: boolean;
}) {
  const [count, setCount] = useState(review.helpfulCount);
  const [voted, setVoted] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [pending, startTransition] = useTransition();
  const pushToast = useUiStore((s) => s.pushToast);

  if (removed) return null;

  function vote() {
    startTransition(async () => {
      const result = await toggleHelpfulAction(review.id, slug);
      if (!result.ok) {
        pushToast({ title: result.message ?? 'Could not vote', tone: 'error' });
        return;
      }
      setCount(result.data ?? count);
      setVoted((v) => !v);
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteReviewAction(review.id, slug);
      if (result.ok) {
        setRemoved(true);
        pushToast({ title: 'Review removed.', tone: 'success' });
      }
    });
  }

  return (
    <article className="border-b border-content/10 py-7 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={review.authorName} src={review.authorAvatar} size={44} />
          <div>
            <p className="font-semibold">{review.authorName}</p>
            <p className="text-xs text-content/55">{relativeTime(review.createdAt)}</p>
          </div>
        </div>
        {isOwn && (
          <button
            onClick={remove}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full border border-content/15 px-3 py-1.5 text-xs font-medium text-content/60 hover:border-rouge hover:text-rouge"
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <RatingStars value={review.rating} />
        <h4 className="font-display text-lg font-semibold">{review.title}</h4>
      </div>

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-content/75">{review.body}</p>

      {review.photos.length > 0 && (
        <div className="mt-4 flex gap-2">
          {review.photos.map((photo, i) => (
            <div key={photo + i} className="relative h-24 w-32 overflow-hidden rounded-2xl bg-content/5">
              <ImageWithFallback src={photo} alt="Review photo" fill sizes="128px" seed={photo} className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={vote}
        disabled={pending}
        aria-pressed={voted}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-content/15 px-4 py-2 text-xs font-semibold transition-colors hover:border-content/45 data-[voted=true]:border-rouge data-[voted=true]:text-rouge"
        data-voted={voted}
      >
        <ThumbsUp size={14} />
        Helpful ({count})
      </button>

      <OwnerReply review={review} slug={slug} businessName={businessName} canRespond={canRespond} />
    </article>
  );
}

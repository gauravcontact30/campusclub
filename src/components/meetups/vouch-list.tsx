import { Quote } from 'lucide-react';
import type { Vouch } from '@/types';
import { ratingBreakdown, topHighlights } from '@/lib/data/vouches';
import { Avatar } from '@/components/ui/avatar';
import { RatingStars } from '@/components/ui/rating-stars';
import { Badge } from '@/components/ui/badge';
import { formatDay } from '@/lib/utils';

/**
 * The average alone hides the shape of the feedback, so the histogram sits
 * beside it — five 4s and one 1 is a very different meetup from six 3.5s.
 */
export function VouchSummary({ vouches }: { vouches: Vouch[] }) {
  if (!vouches.length) return null;
  const average = vouches.reduce((sum, v) => sum + v.rating, 0) / vouches.length;
  const rows = ratingBreakdown(vouches);
  const highlights = topHighlights(vouches);

  return (
    <div className="surface-card grid gap-6 p-6 sm:grid-cols-[auto_1fr]">
      <div className="text-center sm:text-left">
        <p className="font-display text-5xl font-bold leading-none text-content">{average.toFixed(1)}</p>
        <RatingStars value={average} className="mt-2 justify-center sm:justify-start" />
        <p className="mt-1.5 text-sm text-content/60">
          {vouches.length} {vouches.length === 1 ? 'person' : 'people'} who went
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          {[...rows].reverse().map((row) => (
            <div key={row.stars} className="flex items-center gap-3 text-xs text-content/60">
              <span className="w-3 tabular-nums">{row.stars}</span>
              <span className="meter flex-1">
                <span className="meter-fill block" style={{ width: `${Math.round(row.share * 100)}%` }} />
              </span>
              <span className="w-6 text-right tabular-nums">{row.count}</span>
            </div>
          ))}
        </div>

        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {highlights.map((h) => (
              <Badge key={h.label} tone="brand">
                {h.label} · {h.count}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VouchList({ vouches }: { vouches: Vouch[] }) {
  if (!vouches.length) {
    return (
      <p className="surface-card p-6 text-sm text-content/65">
        No feedback yet — this one has not run since it was listed. Only people who actually turned up can leave any,
        which is why there is never much of it on a brand-new meetup.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {vouches.map((vouch) => (
        <li key={vouch.id} className="surface-card p-6">
          <div className="flex items-start gap-3">
            <Avatar name={vouch.authorName} src={vouch.authorAvatar} size={38} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-content">{vouch.authorName}</p>
              <p className="flex items-center gap-2 text-xs text-content/55">
                <RatingStars value={vouch.rating} size={13} />
                {formatDay(vouch.createdAt)}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-content/80">{vouch.body}</p>

          {vouch.highlights.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {vouch.highlights.map((h) => (
                <Badge key={h}>{h}</Badge>
              ))}
            </div>
          )}

          {vouch.hostReply && (
            <div className="mt-4 rounded-2xl border-l-2 border-brand bg-content/5 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand">
                <Quote size={12} /> The host replied
              </p>
              <p className="mt-2 text-sm leading-relaxed text-content/80">{vouch.hostReply}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

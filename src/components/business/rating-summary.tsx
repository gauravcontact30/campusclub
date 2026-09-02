import type { Review } from '@/types';
import { RatingStars } from '@/components/ui/rating-stars';
import { ratingBreakdown } from '@/lib/data/reviews';
import { pluralize } from '@/lib/utils';

export function RatingSummary({ rating, reviews }: { rating: number; reviews: Review[] }) {
  const breakdown = ratingBreakdown(reviews);

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="text-center sm:text-left">
        <p className="font-display text-5xl font-semibold">{rating.toFixed(1)}</p>
        <RatingStars value={rating} size={18} className="mt-2 justify-center sm:justify-start" />
        <p className="mt-1 text-sm text-pearl/60">{pluralize(reviews.length, 'review')}</p>
      </div>

      <div className="space-y-1.5">
        {breakdown.map((row) => (
          <div key={row.star} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-xs font-medium text-pearl/60">{row.star} star</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-pearl/10">
              <div className="h-full rounded-full bg-petal" style={{ width: `${row.percent}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right text-xs text-pearl/55">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function RatingStars({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, value - star + 1));
        return (
          <span key={star} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-frost/30" strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-zest" fill="currentColor" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingInput({
  name,
  defaultValue = 0,
  onChange,
}: {
  name: string;
  defaultValue?: number;
  onChange?: (value: number) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const labels = ['', 'Not for me', 'Could be better', 'Solid', 'Really good', 'Best in the city'];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} out of 5`}
            aria-pressed={value === star}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onClick={() => {
              setValue(star);
              onChange?.(star);
            }}
            className="rounded-full p-1 transition-transform hover:scale-110"
          >
            <Star
              size={30}
              className={star <= shown ? 'text-zest' : 'text-frost/30'}
              fill={star <= shown ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-frost/60">{labels[shown] ?? ''}</span>
    </div>
  );
}

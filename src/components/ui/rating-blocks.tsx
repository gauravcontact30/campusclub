'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Five filled blocks rather than five outlined stars.
 *
 * Blocks read a rating faster at small sizes: a half-lit star is a shape
 * judgement, a half-lit bar is a length judgement, and length is what people
 * are actually comparing down a list of results. It also means the rating
 * carries the brand colour instead of introducing a gold that belongs to
 * nothing else on the page.
 *
 * The partial block is a real fraction, not a rounded one — 4.3 shows 30% of
 * the fifth block — so the number and the picture never disagree.
 */
export function RatingBlocks({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-[3px]', className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((step) => {
        const fill = Math.max(0, Math.min(1, value - step + 1));
        return (
          <span
            key={step}
            aria-hidden
            className="relative overflow-hidden rounded-[3px]"
            style={{ width: size, height: size, backgroundColor: 'rgb(var(--content) / 0.14)' }}
          >
            <span
              className="absolute inset-y-0 left-0 bg-brand"
              style={{ width: `${fill * 100}%` }}
            />
          </span>
        );
      })}
    </span>
  );
}

/**
 * The same language as an input. Hovering previews the value, and the label
 * underneath says in words what the blocks say in length — which is the part
 * people read before committing.
 */
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
  const labels = ['', 'Not for me', 'Could be better', 'Solid', 'Really good', 'Best thing I do all week'];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((step) => (
          <button
            key={step}
            type="button"
            aria-label={`Rate ${step} out of 5`}
            aria-pressed={value === step}
            onMouseEnter={() => setHover(step)}
            onFocus={() => setHover(step)}
            onClick={() => {
              setValue(step);
              onChange?.(step);
            }}
            className={cn(
              'h-9 w-9 rounded-md border transition-all',
              step <= shown
                ? 'border-brand bg-brand'
                : 'border-content/20 bg-content/5 hover:border-content/40',
            )}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-content/65">{labels[shown] ?? ''}</span>
    </div>
  );
}

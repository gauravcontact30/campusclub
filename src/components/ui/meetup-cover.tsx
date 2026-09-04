'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { coverFor, generatedCover, type GeneratedCover } from '@/lib/media/covers';
import { CategoryIcon } from './category-icon';

/**
 * The visual for a meetup, at any size.
 *
 * A photo when one is configured, and a drawn cover otherwise — the same
 * composition either way, so a board that mixes the two still reads as one
 * grid. If the photo fails to load we fall back to the drawn cover rather than
 * a broken-image icon, which means a dead URL never breaks a layout.
 */
export function MeetupCover({
  categorySlug,
  slug,
  coverImage,
  alt,
  className,
  sizes,
  glyph = 'lg',
  priority,
}: {
  categorySlug: string;
  slug: string;
  coverImage: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  /** How large the drawn glyph sits relative to the frame. */
  glyph?: 'sm' | 'lg';
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const cover = coverFor({ coverImage, categorySlug, slug });

  if (cover.kind === 'photo' && !failed) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Image
          src={cover.src}
          alt={alt}
          fill
          sizes={sizes ?? '(max-width: 640px) 100vw, 33vw'}
          priority={priority}
          className="object-cover"
          onError={() => setFailed(true)}
        />
        {/* Keeps overlaid type legible whatever the photo does. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent"
        />
      </div>
    );
  }

  return (
    <DrawnCover
      cover={generatedCover(categorySlug, slug)}
      categorySlug={categorySlug}
      alt={alt}
      className={className}
      glyph={glyph}
    />
  );
}

function DrawnCover({
  cover,
  categorySlug,
  alt,
  className,
  glyph,
}: {
  cover: GeneratedCover;
  categorySlug: string;
  alt: string;
  className?: string;
  glyph: 'sm' | 'lg';
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn('relative overflow-hidden', className)}
      style={{ backgroundImage: `linear-gradient(${cover.angle}deg, ${cover.from}, ${cover.to})` }}
    >
      {/* A soft off-centre light, so the fill has depth rather than reading as
          a flat swatch. */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(120% 100% at ${cover.highlight}, rgb(255 255 255 / 0.30), transparent 62%)`,
        }}
      />
      {/* The category glyph, oversized and cropped by the frame — a section
          marker rather than an icon sitting politely in the middle. */}
      <span
        aria-hidden
        // White rather than a token: CATEGORY_TONES are fixed dark hues, so the
        // glyph needs the same contrast in both themes.
        className={cn(
          'absolute text-white/30',
          glyph === 'lg' ? '-bottom-6 -right-5' : '-bottom-3 -right-2',
        )}
        style={{ transform: `rotate(${cover.tilt}deg)` }}
      >
        <CategoryIcon slug={categorySlug} size={glyph === 'lg' ? 132 : 62} strokeWidth={1.25} />
      </span>
    </div>
  );
}

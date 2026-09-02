'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { cn, hashIndex } from '@/lib/utils';

const GRADIENTS = [
  'from-canvas to-canvas-500',
  'from-brand to-glint',
  'from-canvas-600 to-signal',
  'from-glint to-brand-600',
  'from-signal to-canvas',
  'from-canvas-700 to-brand',
];

/**
 * next/image with a graceful degradation path: if the remote asset 404s or the
 * network is unavailable, we render a deterministic brand gradient instead of a
 * broken-image icon.
 */
export function ImageWithFallback({
  seed,
  className,
  alt,
  ...props
}: ImageProps & { seed?: string }) {
  const [failed, setFailed] = useState(false);
  const gradient = GRADIENTS[hashIndex(seed ?? String(props.src), GRADIENTS.length)];

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn('bg-gradient-to-br', gradient, className)}
      />
    );
  }

  return <Image alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}

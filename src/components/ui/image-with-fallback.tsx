'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { cn, hashIndex } from '@/lib/utils';

const GRADIENTS = [
  'from-noir to-noir-500',
  'from-orchid to-zest',
  'from-noir-600 to-parrot',
  'from-zest to-orchid-600',
  'from-parrot to-noir',
  'from-noir-700 to-orchid',
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

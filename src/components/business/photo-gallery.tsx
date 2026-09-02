'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { cn } from '@/lib/utils';

export function PhotoGallery({ images, name }: { images: string[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const shots = images.length ? images : ['/img/covers/cover-01.svg'];

  return (
    <>
      <div className="grid gap-2 overflow-hidden rounded-4xl sm:grid-cols-4 sm:grid-rows-2">
        {shots.slice(0, 5).map((src, i) => (
          <button
            key={src + i}
            onClick={() => setOpen(i)}
            className={cn(
              'relative overflow-hidden bg-ink/5 transition-opacity hover:opacity-90',
              i === 0 ? 'aspect-[16/10] sm:col-span-2 sm:row-span-2 sm:aspect-auto' : 'hidden aspect-[4/3] sm:block',
            )}
            aria-label={`Open photo ${i + 1} of ${name}`}
          >
            <ImageWithFallback src={src} alt={`${name} — photo ${i + 1}`} fill sizes="50vw" seed={`${name}-${i}`} className="object-cover" priority={i === 0} />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo viewer`}
          className="fixed inset-0 z-[70] flex animate-fade-in items-center justify-center bg-ink/95 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            onClick={() => setOpen(null)}
            aria-label="Close photo viewer"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-cream/10 text-cream hover:bg-cream/20"
          >
            <X size={20} />
          </button>
          <div className="relative aspect-[4/3] w-full max-w-4xl overflow-hidden rounded-3xl">
            <ImageWithFallback src={shots[open]} alt={`${name} — photo ${open + 1}`} fill sizes="90vw" seed={`${name}-${open}`} className="object-cover" />
          </div>
        </div>
      )}
    </>
  );
}

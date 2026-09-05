'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { useLocale } from '@/lib/i18n/client';
import { fill } from '@/lib/i18n/format';
import { LANDING_SLIDES, sliderImageUrl } from '@/lib/media/slides';
import { cn } from '@/lib/utils';

const AUTOPLAY_MS = 5000;

/**
 * The one purely visual section on the page — four flagship categories as
 * full-bleed photography, each a real link into that category's board rather
 * than a brochure image. It sits above the Hero on purpose: the Hero already
 * carries the pitch and the search box, so this opener's only job is to prove
 * in one glance what "a meetup" actually looks like before anyone reads a
 * word.
 *
 * Autoplay pauses on hover/focus and is skipped entirely under
 * prefers-reduced-motion — a banner that keeps moving under a pointer that
 * is trying to read it is a worse opener than a static one.
 */
export function LandingSlider() {
  const { t } = useLocale();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (paused || reduceMotionRef.current) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % LANDING_SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const goTo = useCallback((index: number) => {
    setActive((index + LANDING_SLIDES.length) % LANDING_SLIDES.length);
  }, []);

  return (
    <section
      className="relative isolate h-[420px] w-full overflow-hidden border-b border-content/10 sm:h-[480px] lg:h-[560px]"
      aria-roledescription="carousel"
      aria-label="Featured meetup categories"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') goTo(active - 1);
        if (event.key === 'ArrowRight') goTo(active + 1);
      }}
    >
      {LANDING_SLIDES.map((slide, index) => {
        const copy = t.landingSlider.slides[slide.id as keyof typeof t.landingSlider.slides];
        const isActive = index === active;
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-out',
              isActive ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <ImageWithFallback
              src={sliderImageUrl(slide.imageId)}
              alt=""
              seed={slide.imageId}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="container-page relative flex h-full items-end pb-12 sm:pb-16">
              <div className="max-w-xl text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">{copy.eyebrow}</p>
                <h2 className="display-lg mt-2 text-balance">{copy.headline}</h2>
                <p className="lede mt-3 text-white/85">{copy.body}</p>
                <Link
                  href={`/meetups?category=${slide.categorySlug}`}
                  tabIndex={isActive ? 0 : -1}
                  /* Literal white-on-near-black, not the theme's `text-content` /
                     `bg-white` pair: this pill floats on a photo, not the page
                     canvas, and `--content` flips to near-white in dark themes —
                     pairing it with a literal white background made the label
                     unreadable there. Both sides of this pill are deliberately
                     theme-independent. */
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-white/90"
                >
                  {copy.cta} →
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        aria-label={t.landingSlider.prev}
        onClick={() => goTo(active - 1)}
        className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50 sm:flex"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        aria-label={t.landingSlider.next}
        onClick={() => goTo(active + 1)}
        className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50 sm:flex"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
        {LANDING_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={fill(t.landingSlider.goTo, { number: index + 1 })}
            aria-current={index === active}
            onClick={() => goTo(index)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              index === active ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75',
            )}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {`${t.landingSlider.slides[LANDING_SLIDES[active].id as keyof typeof t.landingSlider.slides].headline} (${active + 1}/${LANDING_SLIDES.length})`}
      </p>
    </section>
  );
}

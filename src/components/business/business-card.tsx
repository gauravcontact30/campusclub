import Link from 'next/link';
import { MapPin, Navigation } from 'lucide-react';
import type { Business } from '@/types';
import { CATEGORIES } from '@/lib/constants';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { RatingStars } from '@/components/ui/rating-stars';
import { Badge } from '@/components/ui/badge';
import { OpenNowBadge } from './open-now-badge';
import { SaveButton } from './save-button';
import { formatCount, formatDistance, priceLabel } from '@/lib/utils';

export function BusinessCard({
  business,
  saved = false,
  priority = false,
}: {
  business: Business;
  saved?: boolean;
  priority?: boolean;
}) {
  const category = CATEGORIES.find((c) => c.slug === business.categorySlug);

  // `relative` anchors the stretched title link below: without a positioned
  // ancestor the pseudo-element grows to fill the section and swallows clicks
  // across the whole page.
  return (
    <article className="group surface-card relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-content/5">
        {/* The title link below is stretched across the card, so the image
            needs no anchor of its own. */}
        <ImageWithFallback
          src={business.coverImage}
          alt={business.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          seed={business.slug}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* z-10 keeps the bookmark above the stretched title link, otherwise
            the overlay eats the click. */}
        <div className="absolute right-3 top-3 z-10">
          <SaveButton businessId={business.id} saved={saved} />
        </div>
        {business.isClaimed && (
          <span className="absolute left-3 top-3">
            <Badge tone="dark">Claimed</Badge>
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-snug">
            <Link href={`/businesses/${business.slug}`} className="after:absolute after:inset-0 hover:text-rouge">
              {business.name}
            </Link>
          </h3>
          <span className="shrink-0 text-sm font-semibold text-content/55">{priceLabel(business.priceLevel, business.city)}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <RatingStars value={business.rating} />
          <span className="text-sm font-semibold">{business.rating.toFixed(1)}</span>
          <span className="text-sm text-content/55">
            ({formatCount(business.reviewCount)} {business.reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-content/60">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">
            {business.neighborhood}, {business.city} · {category?.name}
          </span>
        </p>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-content/65">{business.description}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <OpenNowBadge hours={business.hours} />
          <div className="hidden gap-1.5 sm:flex">
            {typeof business.distanceKm === 'number' ? (
              <Badge tone="blush">
                <Navigation size={11} />
                {formatDistance(business.distanceKm)}
              </Badge>
            ) : (
              business.tags.slice(0, 1).map((tag) => <Badge key={tag}>{tag}</Badge>)
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

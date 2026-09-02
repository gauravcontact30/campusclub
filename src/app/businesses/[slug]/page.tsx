import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Globe, Phone, Share2, ShieldCheck, Star } from 'lucide-react';
import { getBusinessBySlug, getRelatedBusinesses, getAllBusinessSlugs } from '@/lib/data/businesses';
import { getReviews, type ReviewSort } from '@/lib/data/reviews';
import { getCurrentUser } from '@/lib/auth/session';
import { getSavedBusinessIds } from '@/lib/data/saves';
import { CATEGORIES } from '@/lib/constants';
import { PhotoGallery } from '@/components/business/photo-gallery';
import { RatingStars } from '@/components/ui/rating-stars';
import { Badge } from '@/components/ui/badge';
import { SaveButton } from '@/components/business/save-button';
import { OpenNowBadge } from '@/components/business/open-now-badge';
import { HoursTable } from '@/components/business/hours-table';
import { MapPanel } from '@/components/business/map-panel';
import { RatingSummary } from '@/components/business/rating-summary';
import { ReviewCard } from '@/components/business/review-card';
import { ReviewForm } from '@/components/business/review-form';
import { BusinessCard } from '@/components/business/business-card';
import { pluralize, priceLabel } from '@/lib/utils';

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllBusinessSlugs();
  return slugs.slice(0, 24).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return { title: 'Place not found' };

  return {
    title: `${business.name} — ${business.neighborhood}, ${business.city}`,
    description: business.description.slice(0, 155),
    openGraph: { images: [business.coverImage] },
  };
}

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'helpful', label: 'Most helpful' },
  { value: 'high', label: 'Highest rated' },
  { value: 'low', label: 'Lowest rated' },
];

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; claimed?: string }>;
}) {
  const { slug } = await params;
  const { sort, claimed } = await searchParams;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const reviewSort = (SORTS.find((s) => s.value === sort)?.value ?? 'recent') as ReviewSort;
  const [reviews, related, user] = await Promise.all([
    getReviews(business.id, reviewSort),
    getRelatedBusinesses(business),
    getCurrentUser(),
  ]);
  const savedIds = user ? await getSavedBusinessIds(user.id) : [];
  const ownReview = user ? reviews.find((r) => r.userId === user.id) ?? null : null;
  const category = CATEGORIES.find((c) => c.slug === business.categorySlug);
  const isOwner = Boolean(user && business.ownerId === user.id);
  const unanswered = reviews.filter((r) => !r.ownerResponse).length;

  return (
    <div className="container-page py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-ink/50">
        <Link href="/businesses" className="hover:text-ink">
          Directory
        </Link>
        <span>/</span>
        <Link href={`/businesses?city=${business.city.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-ink">
          {business.city}
        </Link>
        <span>/</span>
        <span className="text-ink">{business.name}</span>
      </nav>

      {isOwner && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-sage/50 bg-sage/15 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck size={18} className="text-sage-600" />
            {claimed === '1' ? `Claimed — ${business.name} is yours to manage.` : 'You manage this listing.'}
            {unanswered > 0 && (
              <span className="text-ink/60">
                {unanswered} review{unanswered === 1 ? '' : 's'} without a reply.
              </span>
            )}
          </p>
          <a href="#reviews" className="text-sm font-semibold text-flame-700 hover:underline">
            Respond to reviews →
          </a>
        </div>
      )}

      <PhotoGallery images={business.images} name={business.name} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="display-lg">{business.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <RatingStars value={business.rating} size={18} />
                <span className="font-semibold">{business.rating.toFixed(1)}</span>
                <span className="text-ink/55">({pluralize(business.reviewCount, 'review')})</span>
                <span className="text-ink/30">·</span>
                <span className="text-ink/70">{priceLabel(business.priceLevel, business.city)}</span>
                <span className="text-ink/30">·</span>
                <Link href={`/businesses?category=${business.categorySlug}`} className="text-ink/70 hover:text-flame">
                  {category?.name}
                </Link>
              </div>
              <div className="mt-2">
                <OpenNowBadge hours={business.hours} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/businesses/${slug}/review`}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-flame px-5 text-sm font-semibold text-cream hover:bg-flame-600"
              >
                <Star size={16} /> Write a review
              </Link>
              <SaveButton businessId={business.id} saved={savedIds.includes(business.id)} variant="full" />
            </div>
          </div>

          <p className="lede mt-6">{business.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {business.tags.map((tag) => (
              <Badge key={tag} tone="sage">
                {tag}
              </Badge>
            ))}
            {business.isClaimed && <Badge tone="dark">Owner verified</Badge>}
          </div>

          <section className="mt-12 border-t border-ink/10 pt-8">
            <h2 className="display-md">What you get</h2>
            <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {business.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-2.5 text-sm text-ink/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-flame" />
                  {amenity}
                </li>
              ))}
            </ul>
          </section>

          <section id="reviews" className="mt-12 border-t border-ink/10 pt-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="display-md">Reviews</h2>
              <div className="flex flex-wrap gap-1.5">
                {SORTS.map((option) => (
                  <Link
                    key={option.value}
                    href={`/businesses/${slug}?sort=${option.value}#reviews`}
                    scroll={false}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      reviewSort === option.value
                        ? 'border-ink bg-ink text-cream'
                        : 'border-ink/15 text-ink/60 hover:border-ink/40'
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="surface-card mt-6 p-6">
              <RatingSummary rating={business.rating} reviews={reviews} />
            </div>

            <div className="mt-8">
              <ReviewForm
                slug={slug}
                businessName={business.name}
                signedIn={Boolean(user)}
                existing={ownReview}
              />
            </div>

            <div className="mt-4">
              {reviews.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink/55">
                  No reviews yet — yours would be the first.
                </p>
              ) : (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    slug={slug}
                    businessName={business.name}
                    isOwn={review.userId === user?.id}
                    canRespond={isOwner}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <MapPanel business={business} />

          <div className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold">Contact</h2>
            <div className="mt-4 space-y-3 text-sm">
              <a href={`tel:${business.phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 hover:text-flame">
                <Phone size={16} className="text-ink/40" />
                {business.phone}
              </a>
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-3 break-all hover:text-flame"
                >
                  <Globe size={16} className="shrink-0 text-ink/40" />
                  {business.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <p className="flex items-center gap-3 text-ink/60">
                <Share2 size={16} className="text-ink/40" />
                {business.neighborhood}, {business.city}
              </p>
            </div>
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-lg font-semibold">Opening hours</h2>
            <div className="mt-3">
              <HoursTable hours={business.hours} />
            </div>
          </div>

          {!business.ownerId && (
            <div className="rounded-3xl border border-dashed border-ink/25 p-6">
              <h2 className="font-display text-lg font-semibold">Is this your business?</h2>
              <p className="mt-2 text-sm text-ink/65">
                Claim the listing to respond to reviews, fix your hours and add photos.
              </p>
              <Link
                href={`/businesses/${slug}/claim`}
                className="mt-3 inline-block text-sm font-semibold text-flame-700 hover:underline"
              >
                Claim {business.name} →
              </Link>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-ink/10 pt-10">
          <h2 className="display-md">More {category?.name.toLowerCase()} nearby</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <BusinessCard key={item.id} business={item} saved={savedIds.includes(item.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

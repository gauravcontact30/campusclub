import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getBusinessBySlug } from '@/lib/data/businesses';
import { getReviews } from '@/lib/data/reviews';
import { getCurrentUser } from '@/lib/auth/session';
import { ReviewForm } from '@/components/business/review-form';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { RatingStars } from '@/components/ui/rating-stars';
import { pluralize } from '@/lib/utils';

export const metadata: Metadata = { title: 'Write a review' };

export default async function WriteReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/businesses/${slug}/review`);

  const reviews = await getReviews(business.id);
  const existing = reviews.find((r) => r.userId === user.id) ?? null;

  return (
    <div className="container-page max-w-3xl py-10">
      <Link href={`/businesses/${slug}`} className="inline-flex items-center gap-2 text-sm text-pearl/60 hover:text-pearl">
        <ArrowLeft size={16} /> Back to {business.name}
      </Link>

      <div className="surface-card mt-6 flex items-center gap-4 p-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-pearl/5">
          <ImageWithFallback
            src={business.coverImage}
            alt={business.name}
            fill
            sizes="80px"
            seed={business.slug}
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">{business.name}</h1>
          <p className="text-sm text-pearl/60">
            {business.neighborhood}, {business.city}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <RatingStars value={business.rating} />
            <span className="text-sm text-pearl/60">{pluralize(business.reviewCount, 'review')}</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ReviewForm slug={slug} businessName={business.name} signedIn existing={existing} />
      </div>

      <div className="mt-6 rounded-3xl bg-pearl/5 p-6 text-sm leading-relaxed text-pearl/65">
        <p className="font-semibold text-pearl">A good review, in three lines</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>What you ordered or booked, and what it cost.</li>
          <li>What the service was like on the day — waiting times included.</li>
          <li>Whether you would go back, and who you would bring.</li>
        </ul>
      </div>
    </div>
  );
}

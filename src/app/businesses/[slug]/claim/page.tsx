import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, BadgeCheck, MessageSquareReply, Clock3 } from 'lucide-react';
import { getBusinessBySlug } from '@/lib/data/businesses';
import { getCurrentUser } from '@/lib/auth/session';
import { ClaimForm } from '@/components/business/claim-form';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Claim your listing' };

const PERKS = [
  { icon: MessageSquareReply, title: 'Reply to every review', body: 'Answer publicly under your business name. You cannot delete criticism — nobody can — but you always get the last word.' },
  { icon: Clock3, title: 'Correct your details', body: 'Hours, phone, address and photos stop being crowd-sourced guesses the moment you take the listing over.' },
  { icon: BadgeCheck, title: 'A claimed badge', body: 'Claimed listings carry a badge on every card and rank a little higher in “recommended”.' },
];

export default async function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/businesses/${slug}/claim`);

  // Already settled — send people back to the listing rather than a dead form.
  if (business.ownerId) redirect(`/businesses/${slug}`);

  return (
    <div className="container-page py-10 sm:py-14">
      <Link href={`/businesses/${slug}`} className="inline-flex items-center gap-2 text-sm text-frost/60 hover:text-frost">
        <ArrowLeft size={16} /> Back to {business.name}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="surface-card flex items-center gap-4 p-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-frost/5">
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
              <p className="text-sm text-frost/60">
                {business.address}, {business.neighborhood}, {business.city}
              </p>
              <div className="mt-1.5">
                <Badge>Unclaimed</Badge>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <ClaimForm slug={slug} businessName={business.name} />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          {PERKS.map((perk) => (
            <div key={perk.title} className="surface-card p-6">
              <perk.icon size={22} className="text-orchid" />
              <h2 className="mt-3 font-display text-lg font-semibold">{perk.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-frost/65">{perk.body}</p>
            </div>
          ))}
          <p className="px-2 text-xs leading-relaxed text-frost/55">
            Claiming a business you do not represent is a breach of our terms and gets the account removed.
          </p>
        </aside>
      </div>
    </div>
  );
}

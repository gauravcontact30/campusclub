import type { Business, PriceLevel } from '@/types';

/** Supabase row → domain object. Split out so several modules can share it. */
export default function mapBusinessRow(row: Record<string, unknown>): Business {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    categorySlug: String(row.category_slug),
    tags: (row.tags as string[]) ?? [],
    description: String(row.description ?? ''),
    phone: String(row.phone ?? ''),
    website: String(row.website ?? ''),
    address: String(row.address ?? ''),
    neighborhood: String(row.neighborhood ?? ''),
    city: String(row.city ?? ''),
    state: String(row.state ?? ''),
    postalCode: String(row.postal_code ?? ''),
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
    priceLevel: (Number(row.price_level) || 2) as PriceLevel,
    coverImage: String(row.cover_image ?? ''),
    images: (row.images as string[]) ?? [],
    hours: row.hours as Business['hours'],
    amenities: (row.amenities as string[]) ?? [],
    ownerId: (row.owner_id as string | null) ?? null,
    isClaimed: Boolean(row.is_claimed),
    createdAt: String(row.created_at),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
  };
}

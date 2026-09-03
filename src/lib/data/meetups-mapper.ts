import type { Audience, Cadence, Level, Meetup } from '@/types';

type Row = Record<string, unknown>;

/** One place where the Postgres column names meet the domain model. */
export default function mapMeetup(row: Row): Meetup {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    categorySlug: String(row.category_slug),
    hostId: String(row.host_id),
    description: String(row.description ?? ''),
    agenda: (row.agenda as string[]) ?? [],
    bring: (row.bring as string[]) ?? [],
    venueName: String(row.venue_name ?? ''),
    address: String(row.address ?? ''),
    area: String(row.area ?? ''),
    city: String(row.city ?? ''),
    state: String(row.state ?? ''),
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    spotsTotal: Number(row.spots_total ?? 0),
    spotsTaken: Number(row.spots_taken ?? 0),
    joinFeeCents: Number(row.join_fee_cents ?? 0),
    level: (String(row.level ?? 'any') as Level),
    audience: (String(row.audience ?? 'everyone') as Audience),
    language: String(row.language ?? 'English'),
    cadence: (String(row.cadence ?? 'once') as Cadence),
    coverImage: (row.cover_image as string | null) ?? null,
    tags: (row.tags as string[]) ?? [],
    createdAt: String(row.created_at),
    rating: Number(row.rating ?? 0),
    vouchCount: Number(row.vouch_count ?? 0),
  };
}

import type { MetadataRoute } from 'next';
import { searchMeetups } from '@/lib/data/meetups';
import { CATEGORIES, CITIES, SITE } from '@/lib/constants';
import { STORIES } from '@/lib/content/stories';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items } = await searchMeetups({ perPage: 1000 });

  const staticRoutes = [
    '',
    '/meetups',
    '/passes',
    '/host',
    '/how-it-works',
    '/about',
    '/cities',
    '/stories',
    '/help',
    '/contact',
    '/safety',
    '/partners',
    '/ambassadors',
    '/careers',
    '/press',
    '/legal',
    '/legal/terms',
    '/legal/privacy',
    '/legal/refunds',
    '/legal/cookies',
    '/signup',
    '/login',
  ];

  return [
    ...staticRoutes.map((route) => ({ url: `${SITE.url}${route}`, lastModified: new Date() })),
    // The filtered boards are real landing pages — "group study in Pune" is
    // what somebody actually searches for.
    ...CATEGORIES.map((c) => ({ url: `${SITE.url}/meetups?category=${c.slug}`, lastModified: new Date() })),
    ...CITIES.map((c) => ({ url: `${SITE.url}/meetups?city=${c.slug}`, lastModified: new Date() })),
    ...CITIES.map((c) => ({ url: `${SITE.url}/cities/${c.slug}`, lastModified: new Date() })),
    ...STORIES.map((s) => ({ url: `${SITE.url}/stories/${s.slug}`, lastModified: new Date(s.publishedAt) })),
    ...items.map((m) => ({
      url: `${SITE.url}/meetups/${m.slug}`,
      lastModified: new Date(m.createdAt),
    })),
  ];
}

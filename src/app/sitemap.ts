import type { MetadataRoute } from 'next';
import { getAllBusinessSlugs } from '@/lib/data/businesses';
import { getDinners } from '@/lib/data/dinners';
import { SITE } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, dinners] = await Promise.all([getAllBusinessSlugs(), getDinners()]);

  const staticRoutes = ['', '/businesses', '/dinners', '/dinners/quiz', '/pricing', '/how-it-works', '/about', '/add-business'];

  return [
    ...staticRoutes.map((route) => ({ url: `${SITE.url}${route}`, lastModified: new Date() })),
    ...slugs.map((slug) => ({ url: `${SITE.url}/businesses/${slug}`, lastModified: new Date() })),
    ...dinners.map((d) => ({ url: `${SITE.url}/dinners/${d.id}`, lastModified: new Date() })),
  ];
}

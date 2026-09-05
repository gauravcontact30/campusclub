/**
 * The four banner images on the landing page slider, one per flagship
 * category. Same reasoning as portraits.ts: the id is stored once, and the
 * CDN is asked for whatever crop the banner needs at a given breakpoint.
 *
 * Verify with:
 *
 *   npm run media:check
 */

const HOST = 'https://images.unsplash.com';

export function sliderImageUrl(id: string, width = 1920, height = 900) {
  return `${HOST}/${id}?w=${width}&h=${height}&fit=crop&q=80`;
}

export interface SlideContent {
  id: string;
  /** Unsplash photo id — see sliderImageUrl. */
  imageId: string;
  /** The category this slide is a window onto. */
  categorySlug: string;
}

export const LANDING_SLIDES: SlideContent[] = [
  { id: 'groupStudy', imageId: 'photo-1523240795612-9a054b0db644', categorySlug: 'group-study' },
  { id: 'dinner', imageId: 'photo-1753351055582-67172f8c4d27', categorySlug: 'dinner' },
  { id: 'weekendTrips', imageId: 'photo-1629185752152-fe65698ddee4', categorySlug: 'weekend-trips' },
  { id: 'networking', imageId: 'photo-1563461661026-49631dd5d68e', categorySlug: 'networking' },
];

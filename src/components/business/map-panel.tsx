import { ExternalLink, MapPin } from 'lucide-react';
import type { Business } from '@/types';

/**
 * A lightweight, dependency-free map card. Rendering a real tile layer would
 * mean shipping a map SDK and a key for something most visitors only glance at,
 * so we draw the neighbourhood grid and hand off to the user's map app.
 */
export function MapPanel({ business }: { business: Business }) {
  const query = encodeURIComponent(`${business.name}, ${business.address}, ${business.city}`);

  return (
    <div className="overflow-hidden rounded-3xl border border-content/10">
      <div className="relative h-44 bg-canvas-600">
        <svg aria-hidden viewBox="0 0 400 180" className="absolute inset-0 h-full w-full opacity-40">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" strokeWidth="0.6" className="stroke-content/45" />
            </pattern>
          </defs>
          <rect width="400" height="180" fill="url(#grid)" />
          <path d="M0 120 L140 120 L140 180" strokeWidth="6" fill="none" opacity="0.5" className="stroke-marigold" />
          <path d="M240 0 L240 90 L400 90" strokeWidth="6" fill="none" opacity="0.5" className="stroke-marigold" />
        </svg>
        <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ember text-content shadow-lift">
            <MapPin size={20} />
          </span>
          <span className="mt-1 h-3 w-3 rotate-45 rounded-sm bg-ember/40" />
        </span>
      </div>

      <div className="space-y-1 bg-canvas-700 p-5">
        <p className="text-sm font-semibold">{business.address}</p>
        <p className="text-sm text-content/60">
          {business.neighborhood}, {business.city} {business.postalCode}
        </p>
        <p className="text-xs text-content/50">
          {business.lat.toFixed(4)}, {business.lng.toFixed(4)}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ember-700 hover:underline"
        >
          Get directions <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

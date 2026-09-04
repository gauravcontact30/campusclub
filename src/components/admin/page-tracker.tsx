'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Reports one page view per completed navigation.
 *
 * Mounted once in the root layout, so it survives route changes and fires on
 * the App Router's client navigations, which never hit the server for a
 * document and would otherwise be invisible.
 *
 * `keepalive` so a view still reports when the click that caused it is also
 * leaving the site. Failures are swallowed: a blocked or offline beacon must
 * never surface to a visitor, who did not ask to be counted and cannot act on
 * the error.
 */
export function PageTracker() {
  const pathname = usePathname();
  const lastReported = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastReported.current === pathname) return;
    lastReported.current = pathname;

    // Only the referrer that brought them to the site, not the previous page
    // in this session — the dashboard reports where traffic comes from, and
    // internal navigation is already visible in the session's own path.
    const referrer =
      typeof document !== 'undefined' && document.referrer && !document.referrer.includes(location.host)
        ? document.referrer
        : null;

    void fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}

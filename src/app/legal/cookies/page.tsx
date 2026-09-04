import type { Metadata } from 'next';
import { PageHeader, Prose, Revised, NextUp } from '@/components/site/page-header';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = { title: 'Cookie policy' };

const COOKIES: { name: string; purpose: string; expires: string }[] = [
  { name: 'cc_demo_session', purpose: 'Keeps you signed in. Strictly necessary — the site cannot know who you are without it.', expires: '30 days' },
  { name: 'campusclub-theme', purpose: 'Remembers whether you chose light or dark, rather than following your system setting on every visit.', expires: '1 year' },
  { name: 'campusclub-palette', purpose: 'Remembers which of the five colour palettes you picked in the theme menu.', expires: '1 year' },
  { name: 'campusclub-locale', purpose: 'Remembers whether you switched the site to Hindi.', expires: '1 year' },
];

export default function CookiesPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Cookie policy" />
      <div className="container-page py-14">
        <Revised date="3 September 2026" />
        <Prose>
          <p>
            {SITE.name} sets four cookies, all first-party, none for advertising. We do not run third-party
            trackers, ad pixels, or cross-site analytics — there is nothing here to opt out of beyond the browser&rsquo;s
            own cookie controls.
          </p>

          <h2>The cookies, by name</h2>
        </Prose>

        <div className="mt-6 max-w-[68ch] overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-content/15 text-xs font-bold uppercase tracking-[0.1em] text-content/50">
                <th className="py-3 pr-4">Cookie</th>
                <th className="py-3 pr-4">Purpose</th>
                <th className="py-3">Expires</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c) => (
                <tr key={c.name} className="border-b border-content/10 align-top">
                  <td className="py-3 pr-4 font-mono text-xs text-content">{c.name}</td>
                  <td className="py-3 pr-4 text-content/75">{c.purpose}</td>
                  <td className="py-3 whitespace-nowrap text-content/60">{c.expires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <Prose>
            <h2>Turning cookies off</h2>
            <p>
              Blocking the session cookie means you cannot stay signed in. Blocking the other three just means the
              site re-detects your theme, palette and language preference from your system settings on every visit,
              rather than remembering your last choice — nothing about the product itself changes.
            </p>
            <h2>Changes</h2>
            <p>
              If we ever add a cookie for a new purpose, it will appear in this table before it starts being set.
            </p>
          </Prose>
        </div>
      </div>
      <NextUp
        links={[
          { href: '/legal/privacy', label: 'Privacy policy', blurb: 'What account and activity data we collect, and why.' },
          { href: '/legal/terms', label: 'Terms of service', blurb: 'The full agreement for using CampusClub.' },
        ]}
      />
    </>
  );
}

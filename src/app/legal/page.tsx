import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, RefreshCcw, ShieldCheck, Cookie } from 'lucide-react';
import { PageHeader } from '@/components/site/page-header';

export const metadata: Metadata = { title: 'Legal' };

const DOCS = [
  { href: '/legal/terms', icon: FileText, title: 'Terms of service', blurb: 'The agreement between you and CampusClub for using the site and joining or hosting a meetup.' },
  { href: '/legal/privacy', icon: ShieldCheck, title: 'Privacy policy', blurb: 'What we collect, why, how long we keep it, and what we never do with it.' },
  { href: '/legal/refunds', icon: RefreshCcw, title: 'Refund policy', blurb: 'The cancellation window and how a refund or a returned credit is calculated.' },
  { href: '/legal/cookies', icon: Cookie, title: 'Cookie policy', blurb: 'The handful of cookies the site sets, and what each one is for.' },
];

export default function LegalIndexPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="The four documents, in one place." />
      <div className="container-page py-14">
        <ul className="grid gap-5 sm:grid-cols-2">
          {DOCS.map((doc) => (
            <li key={doc.href}>
              <Link
                href={doc.href}
                className="group surface-card flex h-full min-w-0 flex-col gap-3 p-6 transition-colors hover:border-brand/45"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <doc.icon size={19} />
                </span>
                <h2 className="font-display text-lg font-semibold text-content group-hover:text-brand">{doc.title}</h2>
                <p className="text-sm leading-relaxed text-content/70">{doc.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

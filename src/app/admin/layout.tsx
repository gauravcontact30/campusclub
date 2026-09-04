import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { isSuperAdmin } from '@/lib/admin/config';
import { BACKEND_MODE } from '@/lib/env';
import { AdminNav } from '@/components/admin/admin-nav';

export const metadata: Metadata = {
  title: 'Super Admin',
  // The dashboard exposes members, payments and logs. It must never be
  // indexed, and must never be cached at the edge for the next visitor.
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * The gate.
 *
 * Checked here, in a server component, rather than in the proxy: the proxy
 * would have to make a Supabase call on literally every request to know who
 * is asking, and a layout check cannot be skipped by any route beneath it.
 * Every page under /admin renders inside this, so one check covers all of
 * them — but each page also loads its own data through the repositories,
 * which apply their own row-level security on top.
 *
 * A non-admin gets `notFound`-shaped behaviour rather than a 403: a stranger
 * probing for an admin panel learns nothing from a redirect home, whereas
 * "forbidden" confirms the path exists.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect('/login?next=/admin');
  if (!isSuperAdmin(user)) redirect('/');

  return (
    <div className="container-page py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-content/10 pb-6">
        <div>
          <p className="eyebrow inline-flex items-center gap-1.5">
            <ShieldCheck size={13} />
            Super Admin
          </p>
          <h1 className="display-md mt-2 text-content">Everything, in one place.</h1>
          <p className="mt-1.5 text-sm text-content/60">
            Signed in as {user.email} · reading the{' '}
            <span className="font-semibold text-content/80">
              {BACKEND_MODE === 'supabase' ? 'campusclub_db' : 'in-memory demo'}
            </span>{' '}
            backend
          </p>
        </div>
        <Link href="/" className="link-underline text-sm font-semibold text-content">
          Back to the site →
        </Link>
      </header>

      <AdminNav />

      <div className="mt-8">{children}</div>
    </div>
  );
}

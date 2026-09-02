import Link from 'next/link';
import { Search } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { ButtonLink } from '@/components/ui/button';
import { AccountMenu } from './account-menu';
import { MobileNav } from './mobile-nav';
import { NAV_LINKS } from './nav-links';
import { Logo } from './logo';

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-cream/10 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
      <div className="container-page flex h-[68px] items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo tone="light" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/businesses"
            aria-label="Search businesses"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:border-cream/50 sm:inline-flex"
          >
            <Search size={16} />
          </Link>

          {user ? (
            <AccountMenu user={user} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink href="/login" variant="ghost" size="sm" className="text-cream hover:bg-cream/10">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Join a dinner
              </ButtonLink>
            </div>
          )}

          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}

import Link from 'next/link';
import { Search } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { getDictionary } from '@/lib/i18n/server';
import { ButtonLink } from '@/components/ui/button';
import { AccountMenu } from './account-menu';
import { MobileNav } from './mobile-nav';
import { NAV_LINKS } from './nav-links';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import { LanguageToggle } from './language-toggle';
import { ThemePicker } from './theme-picker';

export async function Navbar() {
  const [user, t] = await Promise.all([getCurrentUser(), getDictionary()]);

  return (
    <header className="sticky top-0 z-50 border-b border-content/10 bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80">
      <div className="container-page flex h-[68px] items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-content/80 transition-colors hover:bg-content/10 hover:text-content"
              >
                {t.nav[link.key]}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {/* Light/dark is a frequent action and stays one click. The palette is
              a rare one, so it hides behind a menu — and on small screens it
              hides entirely, because the drawer carries the same swatches. */}
          <ThemePicker className="hidden sm:inline-flex" />

          <Link
            href="/businesses"
            aria-label={t.header.search}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-content/20 text-content transition-colors hover:border-content/50 sm:inline-flex"
          >
            <Search size={16} />
          </Link>

          {user ? (
            <AccountMenu user={user} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink href="/login" variant="ghost" size="sm" className="text-content hover:bg-content/10">
                {t.header.signIn}
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                {t.header.join}
              </ButtonLink>
            </div>
          )}

          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}

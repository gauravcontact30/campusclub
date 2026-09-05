import { getCurrentUser } from '@/lib/auth/session';
import { getDictionary } from '@/lib/i18n/server';
import { ButtonLink } from '@/components/ui/button';
import { AccountMenu } from './account-menu';
import { MobileNav } from './mobile-nav';
import { DesktopNav } from './desktop-nav';
import { Logo } from './logo';
import { PreferencesMenu } from './preferences-menu';

export async function Navbar() {
  const [user, t] = await Promise.all([getCurrentUser(), getDictionary()]);

  return (
    <header className="sticky top-0 z-50 border-b border-content/10 bg-canvas/80 backdrop-blur-xl supports-[backdrop-filter]:bg-canvas/65">
      {/* Three columns from `lg` up — a 1fr on each side pins the nav to the
          true centre of the page whatever the wordmark and the account button
          happen to measure. Below that it collapses to a plain two-end row and
          the drawer carries the links: five of them plus a wordmark plus the
          two calls to action do not fit a tablet, and a squeezed track that
          runs off the right edge is worse than a menu button. */}
      <div className="container-page flex h-[72px] items-center justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Logo className="justify-self-start" />

        <DesktopNav className="hidden lg:flex" />

        <div className="flex items-center justify-end gap-2">
          {/* Language, light/dark and the palette used to be three icon buttons
              sitting in a row here. They are one dropdown now: the account menu
              for anyone signed in, this popover for everyone else. */}
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <>
              <PreferencesMenu />
              <div className="hidden items-center gap-1.5 sm:flex">
                <ButtonLink
                  href="/login"
                  variant="ghost"
                  size="sm"
                  className="whitespace-nowrap text-content hover:bg-content/10"
                >
                  {t.header.signIn}
                </ButtonLink>
                <ButtonLink href="/signup" size="sm" className="whitespace-nowrap">
                  {t.header.join}
                </ButtonLink>
              </div>
            </>
          )}

          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}

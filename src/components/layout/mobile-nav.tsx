'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS } from './nav-links';
import { useUiStore } from '@/store/ui-store';
import { ButtonLink } from '@/components/ui/button';
import { signOutAction } from '@/app/actions/auth';
import { ThemeToggle } from './theme-toggle';
import { LanguageToggle } from './language-toggle';
import { PaletteRow } from './palette-row';
import { useLocale } from '@/lib/i18n/client';
import type { UserProfile } from '@/types';

export function MobileNav({ user }: { user: UserProfile | null }) {
  const open = useUiStore((s) => s.mobileNavOpen);
  const toggle = useUiStore((s) => s.toggleMobileNav);
  const close = useUiStore((s) => s.closeMobileNav);
  const pathname = usePathname();
  const { t } = useLocale();

  useEffect(() => close(), [pathname, close]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={toggle}
        aria-label={open ? t.header.closeMenu : t.header.openMenu}
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-content/20 text-content md:hidden"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Portalled to <body> on purpose. The header sets `backdrop-blur`, and a
          backdrop-filter makes an element the containing block for its fixed
          descendants — so rendered in place, this panel resolved `bottom-0`
          against the 68px header and collapsed to a sliver with the page
          showing through. */}
      {open &&
        createPortal(
          <div className="fixed inset-x-0 bottom-0 top-[68px] z-50 animate-fade-in overflow-y-auto bg-canvas px-5 pb-10 pt-6 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl px-4 py-4 font-display text-2xl text-content hover:bg-content/10"
                >
                  {t.nav[link.key]}
                </Link>
              ))}
            </nav>

            <div className="mt-8 space-y-3 border-t border-content/15 pt-6">
              <ThemeToggle
                showLabel
                className="flex w-full items-center gap-3 rounded-2xl border border-content/15 px-4 py-3.5 text-sm font-semibold text-content transition-colors hover:bg-content/10"
              />

              <LanguageToggle
                showLabel
                className="flex w-full items-center gap-3 rounded-2xl border border-content/15 px-4 py-3.5 text-sm font-semibold text-content transition-colors hover:bg-content/10"
              />

              <PaletteRow />

              {user ? (
                <>
                  <p className="px-1 text-sm text-content/60">{t.drawer.signedInAs} {user.email}</p>
                  <ButtonLink href="/profile" variant="secondary" full size="lg">
                    {t.drawer.profile}
                  </ButtonLink>
                  <ButtonLink href="/saved" variant="ghost" full size="lg" className="text-content hover:bg-content/10">
                    {t.drawer.saved}
                  </ButtonLink>
                  <ButtonLink
                    href="/bookings"
                    variant="ghost"
                    full
                    size="lg"
                    className="text-content hover:bg-content/10"
                  >
                    {t.drawer.bookings}
                  </ButtonLink>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-full px-5 py-3 text-sm font-semibold text-brand hover:bg-content/10"
                    >
                      {t.drawer.signOut}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <ButtonLink href="/signup" full size="lg">
                    {t.header.join}
                  </ButtonLink>
                  <ButtonLink href="/login" variant="secondary" full size="lg">
                    {t.header.signIn}
                  </ButtonLink>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

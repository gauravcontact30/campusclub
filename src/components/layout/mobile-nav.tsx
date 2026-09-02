'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS } from './nav-links';
import { useUiStore } from '@/store/ui-store';
import { ButtonLink } from '@/components/ui/button';
import { signOutAction } from '@/app/actions/auth';
import type { UserProfile } from '@/types';

export function MobileNav({ user }: { user: UserProfile | null }) {
  const open = useUiStore((s) => s.mobileNavOpen);
  const toggle = useUiStore((s) => s.toggleMobileNav);
  const close = useUiStore((s) => s.closeMobileNav);
  const pathname = usePathname();

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
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-pearl/20 text-pearl md:hidden"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[68px] z-50 animate-fade-in overflow-y-auto bg-noir px-5 pb-10 pt-6 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-4 py-4 font-display text-2xl text-pearl hover:bg-pearl/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 space-y-3 border-t border-pearl/15 pt-6">
            {user ? (
              <>
                <p className="px-1 text-sm text-pearl/60">Signed in as {user.email}</p>
                <ButtonLink href="/profile" variant="secondary" full size="lg">
                  Your profile
                </ButtonLink>
                <ButtonLink href="/saved" variant="ghost" full size="lg" className="text-pearl hover:bg-pearl/10">
                  Saved places
                </ButtonLink>
                <ButtonLink href="/bookings" variant="ghost" full size="lg" className="text-pearl hover:bg-pearl/10">
                  Your dinners
                </ButtonLink>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-full px-5 py-3 text-sm font-semibold text-rouge hover:bg-pearl/10"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <ButtonLink href="/signup" full size="lg">
                  Join a dinner
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" full size="lg">
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

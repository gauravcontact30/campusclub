'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { Bookmark, CalendarCheck, ChevronDown, LogOut, Plus, Settings, ShieldCheck, Ticket, type LucideIcon } from 'lucide-react';
import { isSuperAdmin } from '@/lib/admin/config';
import { Avatar } from '@/components/ui/avatar';
import { signOutAction } from '@/app/actions/auth';
import { useLocale } from '@/lib/i18n/client';
import { useDismissable } from '@/hooks/use-dismissable';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';
import type { UserProfile } from '@/types';

/**
 * The label is a dictionary key rather than a string, so the menu speaks the
 * visitor's language and a key that stops existing is a type error.
 */
const ITEMS = [
  { href: '/my-meetups', key: 'myMeetups', icon: CalendarCheck },
  { href: '/saved', key: 'saved', icon: Bookmark },
  { href: '/host', key: 'host', icon: Plus },
  { href: '/passes', key: 'pass', icon: Ticket },
  { href: '/profile', key: 'profile', icon: Settings },
] as const satisfies readonly { href: string; key: keyof Dictionary['menu']; icon: LucideIcon }[];

export function AccountMenu({ user }: { user: UserProfile }) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  useDismissable(open, ref, useCallback(() => setOpen(false), []));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-content/15 py-1 pl-1 pr-2.5 text-sm font-medium text-content transition-colors hover:border-content/40 hover:bg-content/5"
      >
        <Avatar name={user.fullName} src={user.avatarUrl} size={30} />
        <span className="hidden max-w-[8rem] truncate lg:inline">{user.fullName.split(' ')[0]}</span>
        <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[17.5rem] animate-fade-up overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 shadow-lift"
        >
          <div className="border-b border-content/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-content">{user.fullName}</p>
            <p className="truncate text-xs text-content/55">{user.email}</p>
          </div>

          <div className="py-1">
            {/* Only rendered for the owner. The gate is the /admin layout, not
                this link — hiding it is convenience, not security. */}
            {isSuperAdmin(user) && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-content/5"
              >
                <ShieldCheck size={16} />
                {t.menu.superAdmin}
              </Link>
            )}
            {ITEMS.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-content hover:bg-content/5"
              >
                <Icon size={16} className="text-content/55" />
                {t.menu[key]}
              </Link>
            ))}
          </div>

          <form action={signOutAction} className="border-t border-content/10">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-brand-700 hover:bg-brand/10"
            >
              <LogOut size={16} />
              {t.menu.signOut}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

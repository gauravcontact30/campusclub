'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bookmark, CalendarCheck, ChevronDown, LogOut, Plus, Settings, ShieldCheck, Ticket } from 'lucide-react';
import { isSuperAdmin } from '@/lib/admin/config';
import { Avatar } from '@/components/ui/avatar';
import { signOutAction } from '@/app/actions/auth';
import type { UserProfile } from '@/types';

const ITEMS = [
  { href: '/my-meetups', label: 'Your meetups', icon: CalendarCheck },
  { href: '/saved', label: 'Saved meetups', icon: Bookmark },
  { href: '/host', label: 'Host a meetup', icon: Plus },
  { href: '/passes', label: 'Your pass', icon: Ticket },
  { href: '/profile', label: 'Profile & settings', icon: Settings },
];

export function AccountMenu({ user }: { user: UserProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-content/20 py-1 pl-1 pr-3 text-sm font-medium text-content transition-colors hover:border-content/50"
      >
        <Avatar name={user.fullName} src={user.avatarUrl} size={30} />
        <span className="hidden max-w-[8rem] truncate lg:inline">{user.fullName.split(' ')[0]}</span>
        <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 animate-fade-up overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 shadow-lift"
        >
          <div className="border-b border-content/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-content">{user.fullName}</p>
            <p className="truncate text-xs text-content/55">{user.email}</p>
          </div>
          {/* Only rendered for the owner. The gate is the /admin layout, not
              this link — hiding it is convenience, not security. */}
          {isSuperAdmin(user) && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-content/5"
            >
              <ShieldCheck size={15} />
              Super Admin
            </Link>
          )}
          {ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-content hover:bg-content/5"
            >
              <Icon size={16} className="text-content/55" />
              {label}
            </Link>
          ))}
          <form action={signOutAction} className="border-t border-content/10">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-brand-700 hover:bg-brand/10"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

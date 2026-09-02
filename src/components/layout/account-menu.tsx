'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bookmark, CalendarHeart, ChevronDown, LogOut, Settings, Store } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { signOutAction } from '@/app/actions/auth';
import type { UserProfile } from '@/types';

const ITEMS = [
  { href: '/profile', label: 'Your profile', icon: Settings },
  { href: '/saved', label: 'Saved places', icon: Bookmark },
  { href: '/bookings', label: 'Your dinners', icon: CalendarHeart },
  { href: '/add-business', label: 'Add a business', icon: Store },
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
        className="flex items-center gap-2 rounded-full border border-pearl/20 py-1 pl-1 pr-3 text-sm font-medium text-pearl transition-colors hover:border-pearl/50"
      >
        <Avatar name={user.fullName} src={user.avatarUrl} size={30} />
        <span className="hidden max-w-[8rem] truncate lg:inline">{user.fullName.split(' ')[0]}</span>
        <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 animate-fade-up overflow-hidden rounded-2xl border border-pearl/10 bg-noir-700 shadow-lift"
        >
          <div className="border-b border-pearl/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-pearl">{user.fullName}</p>
            <p className="truncate text-xs text-pearl/55">{user.email}</p>
          </div>
          {ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-pearl hover:bg-pearl/5"
            >
              <Icon size={16} className="text-pearl/55" />
              {label}
            </Link>
          ))}
          <form action={signOutAction} className="border-t border-pearl/10">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-rouge-700 hover:bg-rouge/10"
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, CreditCard, LayoutDashboard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/visitors', label: 'Visitors', icon: Users },
  { href: '/admin/api-logs', label: 'API logs', icon: Activity },
  { href: '/admin/revenue', label: 'Revenue', icon: CreditCard },
  { href: '/admin/content', label: 'Content', icon: BarChart3 },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="no-scrollbar mt-6 overflow-x-auto">
      <ul className="flex min-w-max gap-2">
        {TABS.map((tab) => {
          // Exact match for the index, prefix for the rest — otherwise
          // /admin stays lit on every page beneath it.
          const on = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  on
                    ? 'border-transparent bg-brand text-on-brand'
                    : 'border-content/15 text-content/75 hover:border-content/35 hover:text-content',
                )}
              >
                <Icon size={15} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

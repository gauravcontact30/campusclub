'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/i18n/client';
import { NAV_LINKS } from './nav-links';

/**
 * The desktop nav, as one recessed track with the current section lifted out of
 * it on a raised pill. That is the whole elegance argument: five links that all
 * look identical make the header read as a wall of options, where a single
 * highlighted one tells you where you are before you read a word.
 *
 * `startsWith` on a trailing slash rather than a bare prefix, so `/host` does
 * not light up on `/hosting-guide`.
 */
export function DesktopNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className={cn('items-center gap-0.5 rounded-full border border-content/10 bg-content/5 p-1', className)}>
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium tracking-[-0.005em] transition-colors duration-200',
              active ? 'bg-canvas text-content shadow-card' : 'text-content/65 hover:text-content',
            )}
          >
            {t.nav[link.key]}
          </Link>
        );
      })}
    </nav>
  );
}

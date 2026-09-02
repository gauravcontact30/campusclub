import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link
      href="/"
      aria-label="HomeMart home"
      className={cn('group inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight', className)}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-transform group-hover:-rotate-6',
          tone === 'dark' ? 'bg-ink text-cream' : 'bg-cream text-ink',
        )}
      >
        HM
      </span>
      <span className={tone === 'dark' ? 'text-ink' : 'text-cream'}>
        Home<span className="text-flame">Mart</span>
      </span>
    </Link>
  );
}

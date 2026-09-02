import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="HomeMart home"
      className={cn('group inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight', className)}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orchid to-parrot text-sm font-bold text-noir transition-transform group-hover:-rotate-6">
        HM
      </span>
      <span className="text-frost">
        Home<span className="text-orchid-700">Mart</span>
      </span>
    </Link>
  );
}

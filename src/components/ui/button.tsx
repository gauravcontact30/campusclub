import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

const variants: Record<Variant, string> = {
  // The glow is drawn from `--brand` rather than a literal: it used to be a
  // hardcoded rose, which was right for exactly one palette and a pink halo
  // under a green or blue button everywhere else.
  primary: 'bg-brand text-on-brand hover:bg-brand-600 shadow-[0_10px_28px_-12px_rgb(var(--brand)/0.85)]',
  secondary: 'bg-content text-canvas hover:bg-content-200 border border-content/10',
  ghost: 'text-content hover:bg-content/10',
  outline: 'border border-content/25 text-content hover:border-brand hover:bg-brand/15 hover:text-content',
  dark: 'bg-canvas-600 text-content border border-content/15 hover:bg-canvas-500',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-8 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', full, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], full && 'w-full', className)}
      {...props}
    />
  );
});

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  full,
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], full && 'w-full', className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

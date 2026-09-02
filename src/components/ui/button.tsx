import Link from 'next/link';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

const variants: Record<Variant, string> = {
  primary: 'bg-orchid text-frost hover:bg-orchid-600 shadow-[0_10px_28px_-12px_rgba(168,85,247,0.85)]',
  secondary: 'bg-frost text-noir hover:bg-frost-200 border border-frost/10',
  ghost: 'text-frost hover:bg-frost/10',
  outline: 'border border-frost/25 text-frost hover:border-orchid hover:bg-orchid/15 hover:text-frost',
  dark: 'bg-noir-600 text-frost border border-frost/15 hover:bg-noir-500',
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

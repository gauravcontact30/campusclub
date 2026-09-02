import { cn, initials } from '@/lib/utils';
import { ImageWithFallback } from './image-with-fallback';

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-600 text-cream',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <ImageWithFallback src={src} alt={name} width={size} height={size} seed={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-semibold">{initials(name)}</span>
      )}
    </span>
  );
}

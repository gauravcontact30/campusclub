import {
  BookOpen,
  Croissant,
  Dumbbell,
  Footprints,
  GraduationCap,
  Palette,
  Sparkles,
  UtensilsCrossed,
  Volleyball,
  type LucideIcon,
} from 'lucide-react';
import { categoryBySlug } from '@/lib/constants';

/**
 * Only the icons the catalogue actually names are imported, so the bundle does
 * not carry the whole lucide set. A category with an unknown icon falls back to
 * `Sparkles` rather than rendering nothing.
 */
const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Croissant,
  Dumbbell,
  Footprints,
  GraduationCap,
  Palette,
  UtensilsCrossed,
  Volleyball,
};

export function CategoryIcon({
  slug,
  size = 18,
  className,
}: {
  slug: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[categoryBySlug(slug)?.icon ?? ''] ?? Sparkles;
  return <Icon size={size} className={className} aria-hidden />;
}

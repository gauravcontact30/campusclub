import type { CSSProperties } from 'react';
import {
  Bike,
  BookOpen,
  Briefcase,
  Brush,
  Camera,
  ChefHat,
  Clapperboard,
  Coffee,
  Croissant,
  Dices,
  Dumbbell,
  Footprints,
  Gamepad2,
  GraduationCap,
  Guitar,
  HeartHandshake,
  Library,
  Mic2,
  Mountain,
  Palette,
  PawPrint,
  Plane,
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
  Bike,
  BookOpen,
  Briefcase,
  Brush,
  Camera,
  ChefHat,
  Clapperboard,
  Coffee,
  Croissant,
  Dices,
  Dumbbell,
  Footprints,
  Gamepad2,
  GraduationCap,
  Guitar,
  HeartHandshake,
  Library,
  Mic2,
  Mountain,
  Palette,
  PawPrint,
  Plane,
  UtensilsCrossed,
  Volleyball,
};

export function CategoryIcon({
  slug,
  size = 18,
  className,
  style,
}: {
  slug: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = ICONS[categoryBySlug(slug)?.icon ?? ''] ?? Sparkles;
  return <Icon size={size} className={className} style={style} aria-hidden />;
}

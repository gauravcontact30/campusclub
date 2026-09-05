export type Theme = 'light' | 'dark';
export type PaletteId =
  | 'parrot'
  | 'purple'
  | 'yellow'
  | 'orange'
  | 'blue'
  | 'coffee'
  | 'rose'
  | 'navy'
  | 'forest';

export const THEME_STORAGE_KEY = 'campusclub-theme';
export const PALETTE_STORAGE_KEY = 'campusclub-palette';

/**
 * The palette a visitor gets before they choose one. Blue is the most neutral
 * of the six and the least likely to fight a screenshot, a logo or a slide.
 */
export const DEFAULT_PALETTE: PaletteId = 'blue';

/**
 * The nine selectable palettes.
 *
 * Every one is a working brand colour rather than a decoration: each carries
 * its own canvas, ink and signal ramps in globals.css, so picking one repaints
 * the whole page and not just the buttons.
 *
 * `swatch` is the pair shown in the picker — the brand colour and its
 * supporting signal — taken from each palette's LIGHT values, because light is
 * the default theme and the chips should match what a first-time visitor is
 * actually looking at.
 */
export const PALETTES: { id: PaletteId; name: string; blurb: string; swatch: [string, string] }[] = [
  { id: 'parrot', name: 'Parrot green', blurb: 'Bright green, olive signal', swatch: ['#177D34', '#7A6A0A'] },
  { id: 'purple', name: 'Dark purple', blurb: 'Deep violet and warm brass', swatch: ['#6B21A8', '#8A5A0C'] },
  { id: 'yellow', name: 'Yellow', blurb: 'Deep gold, brighter highlight', swatch: ['#A16207', '#B07D04'] },
  { id: 'orange', name: 'Dark orange', blurb: 'Burnt orange and amber', swatch: ['#C2410C', '#8A5A0C'] },
  { id: 'blue', name: 'Blue', blurb: 'Corporate blue and amber', swatch: ['#1D4ED8', '#A16207'] },
  { id: 'coffee', name: 'Light coffee brown', blurb: 'Milk coffee and olive', swatch: ['#8B5E3C', '#6F6425'] },
  { id: 'rose', name: 'Rose', blurb: 'Deep rose and jewel teal', swatch: ['#BE123C', '#0D746E'] },
  { id: 'navy', name: 'Navy', blurb: 'Muted slate-navy and bronze', swatch: ['#1E293B', '#926F3D'] },
  { id: 'forest', name: 'Forest', blurb: 'Deep pine green and warm stone', swatch: ['#154733', '#856C58'] },
];

const IDS = PALETTES.map((p) => p.id);

/**
 * Runs before first paint, inlined into <head>, so the page never renders in
 * one theme or palette and then swaps. It is kept as a string because it has to
 * execute ahead of React — and deliberately kept tiny, since it blocks parsing.
 *
 * Theme authority: an explicit choice, then the operating system, then light.
 * Palette authority: an explicit choice, then the default. Unlike the previous
 * set, no palette is the stylesheet's implicit state, so the attribute is
 * always written — every palette block in globals.css is qualified by it.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var d=document.documentElement,s=localStorage.getItem('${THEME_STORAGE_KEY}');
d.dataset.theme=s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
var p=localStorage.getItem('${PALETTE_STORAGE_KEY}');
d.dataset.palette=${JSON.stringify(IDS)}.indexOf(p)>-1?p:'${DEFAULT_PALETTE}';
}catch(e){document.documentElement.dataset.theme='light';document.documentElement.dataset.palette='${DEFAULT_PALETTE}';}})();`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  remember(THEME_STORAGE_KEY, theme);
}

export function currentPalette(): PaletteId {
  const value = document.documentElement.dataset.palette;
  return IDS.includes(value as PaletteId) ? (value as PaletteId) : DEFAULT_PALETTE;
}

/**
 * Selection lives on <html>, not in React state, so a subscription is how a
 * component learns it changed. This is also what keeps the pickers free of a
 * setState-in-effect, which the React Compiler lint rule rejects outright.
 */
const PALETTE_EVENT = 'campusclub:palettechange';

export function subscribePalette(onChange: () => void) {
  window.addEventListener(PALETTE_EVENT, onChange);
  return () => window.removeEventListener(PALETTE_EVENT, onChange);
}

export function applyPalette(palette: PaletteId) {
  document.documentElement.dataset.palette = palette;
  remember(PALETTE_STORAGE_KEY, palette);
  window.dispatchEvent(new Event(PALETTE_EVENT));
}

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing, or storage disabled. The choice still applies for this
    // page view; it just will not be remembered, which is not worth failing on.
  }
}

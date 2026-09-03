export type Theme = 'light' | 'dark';
export type PaletteId = 'ember' | 'saffron' | 'olive' | 'nightshade' | 'sage';

export const THEME_STORAGE_KEY = 'vibeclub-theme';
export const PALETTE_STORAGE_KEY = 'vibeclub-palette';

/**
 * The five selectable palettes. `swatch` is the pair shown in the picker —
 * the brand colour and its supporting signal — taken from each palette's dark
 * values so the chips read the same whichever theme is active.
 */
export const PALETTES: { id: PaletteId; name: string; blurb: string; swatch: [string, string] }[] = [
  { id: 'ember', name: 'Ember', blurb: 'Terracotta and gold', swatch: ['#EA6C3A', '#F5B342'] },
  { id: 'saffron', name: 'Ink & Saffron', blurb: 'Marigold on ink', swatch: ['#F2A918', '#E07A3C'] },
  { id: 'olive', name: 'Olive & Amber', blurb: 'Bistro green', swatch: ['#9ABE60', '#ECB04A'] },
  { id: 'nightshade', name: 'Nightshade', blurb: 'Indigo and coral', swatch: ['#FF7A59', '#7C98FF'] },
  { id: 'sage', name: 'Sage & Clay', blurb: 'Muted and editorial', swatch: ['#C67A5C', '#96B49E'] },
];

const IDS = PALETTES.map((p) => p.id);

/**
 * Runs before first paint, inlined into <head>, so the page never renders in
 * one theme or palette and then swaps. It is kept as a string because it has to
 * execute ahead of React — and deliberately kept tiny, since it blocks parsing.
 *
 * Theme authority: an explicit choice, then the operating system, then dark.
 * Palette authority: an explicit choice, then Ember, which is the default
 * already baked into the stylesheet and so needs no attribute.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var d=document.documentElement,s=localStorage.getItem('${THEME_STORAGE_KEY}');
d.dataset.theme=s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
var p=localStorage.getItem('${PALETTE_STORAGE_KEY}');
if(p&&${JSON.stringify(IDS)}.indexOf(p)>-1&&p!=='ember')d.dataset.palette=p;
}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  remember(THEME_STORAGE_KEY, theme);
}

export function currentPalette(): PaletteId {
  const value = document.documentElement.dataset.palette;
  return IDS.includes(value as PaletteId) ? (value as PaletteId) : 'ember';
}

/**
 * Selection lives on <html>, not in React state, so a subscription is how a
 * component learns it changed. This is also what keeps the pickers free of a
 * setState-in-effect, which the React Compiler lint rule rejects outright.
 */
const PALETTE_EVENT = 'vibeclub:palettechange';

export function subscribePalette(onChange: () => void) {
  window.addEventListener(PALETTE_EVENT, onChange);
  return () => window.removeEventListener(PALETTE_EVENT, onChange);
}

export function applyPalette(palette: PaletteId) {
  // Ember is the stylesheet's default, so it is expressed as the absence of the
  // attribute rather than as a fifth block that repeats what is already there.
  if (palette === 'ember') delete document.documentElement.dataset.palette;
  else document.documentElement.dataset.palette = palette;
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

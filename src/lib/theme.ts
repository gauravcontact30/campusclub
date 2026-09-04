export type Theme = 'light' | 'dark';
export type PaletteId =
  | 'paper'
  | 'slate'
  | 'graphite'
  | 'harbour'
  | 'court'
  | 'claret'
  | 'ember'
  | 'turf'
  | 'dusk';

export const THEME_STORAGE_KEY = 'campusclub-theme';
export const PALETTE_STORAGE_KEY = 'campusclub-palette';

/**
 * The nine selectable palettes, ordered from most restrained to most
 * expressive rather than alphabetically — somebody opening this menu is
 * usually deciding how loud they want the product to be, so that is the axis
 * the list should read along.
 *
 * `swatch` is the pair shown in the picker — the brand colour and its
 * supporting signal — taken from each palette's LIGHT values, because light is
 * the default theme and the chips should match what a first-time visitor is
 * actually looking at.
 */
export const PALETTES: { id: PaletteId; name: string; blurb: string; swatch: [string, string] }[] = [
  { id: 'paper', name: 'Paper', blurb: 'Cream and signal red', swatch: ['#C22E17', '#A06204'] },
  { id: 'slate', name: 'Slate', blurb: 'Corporate blue on cool grey', swatch: ['#1D4ED8', '#A16207'] },
  { id: 'graphite', name: 'Graphite', blurb: 'Monochrome, weight over hue', swatch: ['#22242C', '#8C5C0A'] },
  { id: 'harbour', name: 'Harbour', blurb: 'Deep teal and amber', swatch: ['#0D6E6A', '#A65E0C'] },
  { id: 'court', name: 'Court', blurb: 'Indigo and amber', swatch: ['#5240D8', '#955F06'] },
  { id: 'claret', name: 'Claret', blurb: 'Wine and brass', swatch: ['#961A3E', '#92640E'] },
  { id: 'ember', name: 'Ember', blurb: 'Terracotta and gold', swatch: ['#C44C1E', '#A46308'] },
  { id: 'turf', name: 'Turf', blurb: 'Pitch green and lime', swatch: ['#147A47', '#5C6A0C'] },
  { id: 'dusk', name: 'Dusk', blurb: 'Plum and rose', swatch: ['#A82C84', '#B24428'] },
];

const IDS = PALETTES.map((p) => p.id);

/**
 * Runs before first paint, inlined into <head>, so the page never renders in
 * one theme or palette and then swaps. It is kept as a string because it has to
 * execute ahead of React — and deliberately kept tiny, since it blocks parsing.
 *
 * Theme authority: an explicit choice, then the operating system, then light.
 * Palette authority: an explicit choice, then Paper, which is the default
 * already baked into the stylesheet and so needs no attribute.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var d=document.documentElement,s=localStorage.getItem('${THEME_STORAGE_KEY}');
d.dataset.theme=s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
var p=localStorage.getItem('${PALETTE_STORAGE_KEY}');
if(p&&${JSON.stringify(IDS)}.indexOf(p)>-1&&p!=='paper')d.dataset.palette=p;
}catch(e){document.documentElement.dataset.theme='light';}})();`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  remember(THEME_STORAGE_KEY, theme);
}

export function currentPalette(): PaletteId {
  const value = document.documentElement.dataset.palette;
  return IDS.includes(value as PaletteId) ? (value as PaletteId) : 'paper';
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
  // Paper is the stylesheet's default, so it is expressed as the absence of the
  // attribute rather than as a fifth block that repeats what is already there.
  if (palette === 'paper') delete document.documentElement.dataset.palette;
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

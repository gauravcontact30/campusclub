export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'sitnext-theme';

/**
 * Runs before first paint, inlined into <head>, so the page never renders in
 * one theme and then swaps. It is kept as a string because it has to execute
 * ahead of React — and deliberately kept tiny, since it blocks parsing.
 *
 * Order of authority: an explicit choice the visitor made, then the operating
 * system's preference, then dark, which is what the stylesheet already assumes.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var s=localStorage.getItem('${THEME_STORAGE_KEY}');
var t=s==='light'||s==='dark'?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
document.documentElement.dataset.theme=t;
}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing, or storage disabled. The choice still applies for this
    // page view; it just will not be remembered, which is not worth failing on.
  }
}

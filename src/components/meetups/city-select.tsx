'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, MapPin, Search, X } from 'lucide-react';
import { CITIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * The "where" half of the search bar.
 *
 * It replaces a native `<select>`, which had a real bug behind it: the bar
 * paints its fields with `bg-transparent` so they read as one welded pill, and
 * a transparent `<select>` hands the operating system a popup with no
 * background of its own — light type on a light list, which is to say a
 * dropdown whose options could not be read at all in the dark theme.
 *
 * Drawing the list ourselves fixes that and buys the two things a
 * twenty-city list actually needs: a filter, and a way to clear it.
 *
 * The panel is portalled to <body> with fixed coordinates. `.searchbar` sets
 * `overflow-hidden` to clip its fields into the pill, and an absolutely
 * positioned panel inside it would be clipped along with them.
 */
export function CitySelect({
  value,
  onChange,
  size = 'md',
  className,
  id,
}: {
  value: string;
  onChange: (slug: string) => void;
  size?: 'md' | 'lg';
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = CITIES.find((c) => c.slug === value);
  const big = size === 'lg';

  /** "Any city" is index 0 of the same list the keyboard walks, so clearing the choice needs no mouse. */
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? CITIES.filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
      : CITIES;
    return [{ slug: '', name: 'Any city', state: 'Everywhere we run' }, ...matches];
  }, [query]);

  // Measured before paint, so the panel never shows for a frame at the top-left
  // of the page and then jumps under the trigger.
  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const box = triggerRef.current?.getBoundingClientRect();
      if (!box) return;
      const width = Math.max(box.width, 264);
      setRect({
        top: box.bottom + 8,
        // Right-aligned to the trigger, then pulled back inside the viewport on
        // a narrow screen rather than hanging off the edge.
        left: Math.min(Math.max(8, box.right - width), window.innerWidth - width - 8),
        width,
      });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
      setQuery('');
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  function close() {
    setOpen(false);
    setQuery('');
    triggerRef.current?.focus();
  }

  function choose(slug: string) {
    onChange(slug);
    close();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const option = options[active];
      if (option) choose(option.slug);
    }
  }

  return (
    <>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        onClick={() => {
          setActive(0);
          setOpen((o) => !o);
        }}
        className={cn(
          'searchbar-field flex max-w-[11rem] shrink-0 cursor-pointer items-center gap-2 text-left font-medium',
          big && 'py-4 text-base',
          className,
        )}
      >
        <MapPin size={big ? 17 : 15} className="shrink-0 text-content/45" aria-hidden />
        {/* Inside the button rather than a `<label for>`: a label would replace
            the accessible name outright, and the chosen city would stop being
            announced at all. */}
        <span className="sr-only">Which city? </span>
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-content/60')}>
          {selected ? selected.name : 'Any city'}
        </span>
        <ChevronDown
          size={15}
          aria-hidden
          className={cn('shrink-0 text-content/45 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            onKeyDown={onKeyDown}
            style={{ top: rect.top, left: rect.left, width: rect.width }}
            className="fixed z-[60] animate-fade-up overflow-hidden rounded-2xl border border-content/10 bg-canvas-700 shadow-lift"
          >
            <div className="flex items-center gap-2 border-b border-content/10 px-3.5 py-2.5">
              <Search size={15} className="shrink-0 text-content/45" aria-hidden />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search cities…"
                aria-label="Search cities"
                aria-autocomplete="list"
                aria-controls={listId}
                className="min-w-0 flex-1 bg-transparent text-sm text-content placeholder:text-content/45 focus:outline-none"
              />
              {/* Clears the typing, not the choice — the full list comes back
                  without the panel shutting under the cursor. */}
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery('');
                    setActive(0);
                    searchRef.current?.focus();
                  }}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-content/50 transition-colors hover:bg-content/10 hover:text-content"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <ul id={listId} role="listbox" aria-label="City" className="max-h-[16.5rem] overflow-y-auto p-1.5">
              {options.length === 1 && query ? (
                <li className="px-3 py-6 text-center text-sm text-content/55">
                  No city matches &ldquo;{query}&rdquo;.
                </li>
              ) : (
                options.map((option, i) => {
                  const isSelected = option.slug === value;
                  return (
                    <li key={option.slug || 'any'}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(option.slug)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                          i === active ? 'bg-content/10' : 'hover:bg-content/5',
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-content">{option.name}</span>
                          <span className="block truncate text-xs text-content/50">{option.state}</span>
                        </span>
                        <Check
                          size={15}
                          aria-hidden
                          className={cn('shrink-0 text-brand', isSelected ? 'opacity-100' : 'opacity-0')}
                        />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}

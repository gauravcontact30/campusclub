'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboOption {
  value: string;
  label: string;
  /** A second line under the label — a state under a city, say. */
  sublabel?: string;
}

/**
 * The dropdown every field inside a `.searchbar` pill uses.
 *
 * It exists because a native `<select>` cannot live in one. The bar paints its
 * fields with `bg-transparent` so they read as a single welded control, and a
 * transparent `<select>` hands the operating system a popup with no background
 * of its own — light type on a light list, which in the dark theme is a
 * dropdown whose options cannot be read at all.
 *
 * This was written once for the city field and then left there, so the state
 * filter on /cities — the same pill, the same transparent field, the same
 * bug — kept its native `<select>` and its unreadable dark-theme popup. Pulled
 * out here, both fields get the same list, the same type-to-filter, the same
 * keyboard, and the same fix.
 *
 * The panel is portalled to <body> with fixed coordinates: `.searchbar` sets
 * `overflow-hidden` to clip its fields into the pill, and an absolutely
 * positioned panel inside it would be clipped along with them.
 */
export function ComboSelect({
  value,
  onChange,
  options,
  clearOption,
  icon: Icon,
  placeholder,
  srLabel,
  listLabel,
  searchLabel,
  searchPlaceholder,
  /** Used to say what did not match: "No city matches …". */
  noun,
  size = 'md',
  className,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboOption[];
  /** Always shown, never filtered out — the "Any city" / "All states" row. */
  clearOption?: ComboOption;
  icon?: LucideIcon;
  placeholder: string;
  /** Names the control for assistive tech, inside the trigger. */
  srLabel: string;
  listLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  noun: string;
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

  const selected = options.find((o) => o.value === value);
  const big = size === 'lg';

  /** The clear row is index 0 of the same list the keyboard walks, so undoing a choice needs no mouse. */
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? options.filter(
          (o) => o.label.toLowerCase().includes(q) || (o.sublabel?.toLowerCase().includes(q) ?? false),
        )
      : options;
    return clearOption ? [clearOption, ...matches] : matches;
  }, [query, options, clearOption]);

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

  function choose(next: string) {
    onChange(next);
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
      setActive((i) => (i + (event.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const option = shown[active];
      if (option) choose(option.value);
    }
  }

  const nothingMatched = query.trim().length > 0 && shown.length === (clearOption ? 1 : 0);

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
          'searchbar-field flex shrink-0 cursor-pointer items-center gap-2 text-left font-medium',
          big && 'py-4 text-base',
          className,
        )}
      >
        {Icon && <Icon size={big ? 17 : 15} className="shrink-0 text-content/45" aria-hidden />}
        {/* Inside the button rather than a `<label for>`: a label would replace
            the accessible name outright, and the current choice would stop
            being announced at all. */}
        <span className="sr-only">{srLabel}</span>
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-content/60')}>
          {selected ? selected.label : placeholder}
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
                placeholder={searchPlaceholder}
                aria-label={searchLabel}
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

            <ul id={listId} role="listbox" aria-label={listLabel} className="max-h-[16.5rem] overflow-y-auto p-1.5">
              {nothingMatched ? (
                <li className="px-3 py-6 text-center text-sm text-content/55">
                  No {noun} matches &ldquo;{query}&rdquo;.
                </li>
              ) : (
                shown.map((option, i) => {
                  const isSelected = option.value === value;
                  return (
                    <li key={option.value || 'any'}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(option.value)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                          i === active ? 'bg-content/10' : 'hover:bg-content/5',
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-content">{option.label}</span>
                          {option.sublabel && (
                            <span className="block truncate text-xs text-content/50">{option.sublabel}</span>
                          )}
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

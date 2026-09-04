/**
 * Admin-only chart primitives. `Stat` and `Panel` moved to `ui/` once the
 * member-facing earnings and pricing surfaces needed the same two shapes;
 * they are re-exported here so the dashboard's imports did not have to churn.
 */
export { Stat, Panel } from '@/components/ui/stat';

/**
 * A horizontal bar chart drawn in CSS.
 *
 * No chart library: this is one series of labelled magnitudes, which a flex
 * row and a width percentage express exactly, and pulling in a charting
 * runtime for it would cost more than the whole dashboard.
 */
export function BarList({
  rows,
  emptyLabel = 'Nothing yet.',
}: {
  rows: { label: string; value: number; hint?: string }[];
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  if (!rows.length) {
    return <p className="px-5 py-8 text-center text-sm text-content/55">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-content/8">
      {rows.map((row) => (
        <li key={row.label} className="px-5 py-3">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-content">{row.label}</span>
            <span className="shrink-0 tabular-nums text-content/70">
              {row.value.toLocaleString('en-IN')}
              {row.hint && <span className="ml-2 text-content/45">{row.hint}</span>}
            </span>
          </div>
          <div className="meter mt-2">
            <div className="meter-fill" style={{ width: `${Math.round((row.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Sparkline-ish column chart for a daily series. */
export function DayChart({
  rows,
  format,
}: {
  rows: { day: string; value: number }[];
  format: (value: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="px-5 py-5">
      <div className="flex h-32 items-end gap-1.5">
        {rows.map((row) => (
          <div key={row.day} className="group relative flex-1">
            <div
              className="rounded-t bg-brand/75 transition-colors group-hover:bg-brand"
              // A floor of 2px so a zero day is still a visible tick on the
              // axis rather than a gap that reads as missing data.
              style={{ height: `${Math.max(2, Math.round((row.value / max) * 128))}px` }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-content px-2 py-1 text-xs font-medium text-canvas group-hover:block">
              {format(row.value)} · {row.day.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-content/45">
        <span>{rows[0]?.day.slice(5)}</span>
        <span>{rows[rows.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

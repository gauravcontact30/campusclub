'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createMeetupAction } from '@/app/actions/meetups';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { CategoryIcon } from '@/components/ui/category-icon';
import { useUiStore } from '@/store/ui-store';
import {
  AUDIENCES,
  BRING_PRESETS,
  CADENCES,
  CATEGORIES,
  CITIES,
  FEE_PRESETS,
  LANGUAGES,
  LEVELS,
} from '@/lib/constants';
import { cn, formatMoney } from '@/lib/utils';
import { projectedTake } from '@/lib/economics';
import type { ActionResult } from '@/types';

/** A sensible default: seven days out, at seven in the evening. */
function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(19, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HostForm({ defaultCity }: { defaultCity?: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(createMeetupAction, null);
  const pushToast = useUiStore((s) => s.pushToast);

  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [fee, setFee] = useState(FEE_PRESETS[1]);
  // Controlled so the earnings line below can do its arithmetic live — this is
  // the moment a host is deciding whether hosting is worth their evening.
  const [spots, setSpots] = useState(8);
  const [bring, setBring] = useState<string[]>(['Just yourself']);
  const [agenda, setAgenda] = useState<string[]>(['', '', '']);

  useEffect(() => {
    if (state && !state.ok && state.message) pushToast({ title: state.message, tone: 'error' });
  }, [state, pushToast]);

  return (
    <form action={formAction} className="space-y-10">
      <section className="space-y-5">
        <SectionHead step={1} title="What are you doing?" />

        <fieldset>
          <legend className="mb-2.5 block text-sm font-semibold text-content">Kind of meetup</legend>
          <input type="hidden" name="categorySlug" value={category} />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategory(c.slug)}
                aria-pressed={category === c.slug}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
                  category === c.slug
                    ? 'border-brand bg-brand/15 text-brand-700'
                    : 'border-content/15 text-content/75 hover:border-content/40',
                )}
              >
                <CategoryIcon slug={c.slug} size={15} />
                {c.name}
              </button>
            ))}
          </div>
          {state?.fieldErrors?.categorySlug && (
            <p role="alert" className="mt-2 text-xs font-medium text-brand-700">
              {state.fieldErrors.categorySlug}
            </p>
          )}
        </fieldset>

        <Field
          label="Title"
          htmlFor="title"
          hint="Say what it is and who it is for. “Deep work table — 3 hours, phones in the box” beats “Study session”."
          error={state?.fieldErrors?.title}
        >
          <Input id="title" name="title" maxLength={90} placeholder="Sunrise 5K around the lake" required />
        </Field>

        <Field
          label="What actually happens"
          htmlFor="description"
          hint="The more specific, the fewer people turn up expecting something else."
          error={state?.fieldErrors?.description}
        >
          <Textarea
            id="description"
            name="description"
            placeholder="Two pace groups so nobody runs alone and nobody gets dropped. We finish at the tea stall by the north gate…"
            required
          />
        </Field>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-semibold text-content">The run of play</legend>
          <p className="mb-2.5 text-xs text-content/55">Three or four beats. Leave any blank and it is dropped.</p>
          <div className="space-y-2">
            {agenda.map((line, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  name="agenda"
                  value={line}
                  onChange={(e) => setAgenda(agenda.map((a, j) => (j === i ? e.target.value : a)))}
                  placeholder={i === 0 ? '06:15 — warm up together at the gate' : 'Next…'}
                  maxLength={160}
                />
                {agenda.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setAgenda(agenda.filter((_, j) => j !== i))}
                    aria-label={`Remove step ${i + 1}`}
                    className="shrink-0 rounded-full border border-content/15 px-3 text-content/60 hover:border-content/40"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {agenda.length < 8 && (
            <button
              type="button"
              onClick={() => setAgenda([...agenda, ''])}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
            >
              <Plus size={14} /> Add a step
            </button>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2.5 block text-sm font-semibold text-content">What to bring</legend>
          <div className="flex flex-wrap gap-2">
            {BRING_PRESETS.map((item) => {
              const on = bring.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setBring(on ? bring.filter((b) => b !== item) : [...bring, item])}
                  aria-pressed={on}
                  className={cn(
                    'rounded-full border px-3.5 py-2 text-sm transition-colors',
                    on
                      ? 'border-brand bg-brand/15 text-brand-700'
                      : 'border-content/15 text-content/75 hover:border-content/40',
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
          {bring.map((b) => (
            <input key={b} type="hidden" name="bring" value={b} />
          ))}
        </fieldset>
      </section>

      <section className="space-y-5">
        <SectionHead step={2} title="Where and when" />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City" htmlFor="city" error={state?.fieldErrors?.city}>
            <Select id="city" name="city" defaultValue={defaultCity ?? CITIES[0].name} required>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Neighbourhood" htmlFor="area" error={state?.fieldErrors?.area}>
            <Input id="area" name="area" placeholder="Indiranagar" required />
          </Field>

          <Field label="Venue" htmlFor="venueName" error={state?.fieldErrors?.venueName}>
            <Input id="venueName" name="venueName" placeholder="Third Wave Filter Room" required />
          </Field>

          <Field
            label="Street address"
            htmlFor="address"
            hint="Only people who join see this."
            error={state?.fieldErrors?.address}
          >
            <Input id="address" name="address" placeholder="12, 100 Feet Road" required />
          </Field>

          <Field label="Starts" htmlFor="startsAt" error={state?.fieldErrors?.startsAt}>
            <Input id="startsAt" name="startsAt" type="datetime-local" defaultValue={defaultStart()} required />
          </Field>

          <Field label="Runs for" htmlFor="durationMins" error={state?.fieldErrors?.durationMins}>
            <Select id="durationMins" name="durationMins" defaultValue="90">
              {[30, 45, 60, 75, 90, 120, 150, 180, 240, 300].map((m) => (
                <option key={m} value={m}>
                  {m < 60 ? `${m} minutes` : `${m / 60} hour${m === 60 ? '' : 's'}`}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Repeats" htmlFor="cadence">
            <Select id="cadence" name="cadence" defaultValue="once">
              {CADENCES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Language" htmlFor="language">
            <Select id="language" name="language" defaultValue="English">
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHead step={3} title="Who, and what it costs" />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="How many spots"
            htmlFor="spotsTotal"
            hint="Including you? No — count only the people joining."
            error={state?.fieldErrors?.spotsTotal}
          >
            <Input
              id="spotsTotal"
              name="spotsTotal"
              type="number"
              min={2}
              max={60}
              value={spots}
              onChange={(e) => setSpots(Number(e.target.value))}
              required
            />
          </Field>

          <Field label="How demanding" htmlFor="level">
            <Select id="level" name="level" defaultValue="any">
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label} — {l.hint}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Open to" htmlFor="audience">
            <Select id="audience" name="audience" defaultValue="everyone">
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-semibold text-content">Join fee</legend>
          <p className="mb-2.5 text-xs text-content/55">
            What one person pays to take a spot. Cover your costs — court hire, a day pass, the food — and no more;
            fees that look like profit get very few joins.
          </p>
          <input type="hidden" name="joinFeeCents" value={fee} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFee(0)}
              aria-pressed={fee === 0}
              className={cn(
                'rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
                fee === 0
                  ? 'border-brand bg-brand/15 text-brand-700'
                  : 'border-content/15 text-content/75 hover:border-content/40',
              )}
            >
              Free
            </button>
            {FEE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setFee(preset)}
                aria-pressed={fee === preset}
                className={cn(
                  'rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
                  fee === preset
                    ? 'border-brand bg-brand/15 text-brand-700'
                    : 'border-content/15 text-content/75 hover:border-content/40',
                )}
              >
                {formatMoney(preset)}
              </button>
            ))}
          </div>
          {state?.fieldErrors?.joinFeeCents && (
            <p role="alert" className="mt-2 text-xs font-medium text-brand-700">
              {state.fieldErrors.joinFeeCents}
            </p>
          )}

          <TakeSummary fee={fee} spots={spots} />
        </fieldset>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-content/10 pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Putting it on the board…' : 'Publish this meetup'}
        </Button>
        <p className="text-sm text-content/60">
          You can cancel any time. Everyone who joined is refunded automatically.
        </p>
      </div>
    </form>
  );
}

/**
 * What this meetup is worth to the host, recomputed as they move the two
 * controls above it.
 *
 * The platform takes no commission, so the sum is genuinely `fee × spots` —
 * and saying that out loud, next to a real number, is worth more than any
 * amount of copy about keeping what you earn.
 */
function TakeSummary({ fee, spots }: { fee: number; spots: number }) {
  const safeSpots = Number.isFinite(spots) ? Math.max(0, spots) : 0;
  const take = projectedTake(fee, safeSpots);

  if (fee === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-content/12 bg-canvas-700 p-4 text-sm leading-relaxed text-content/70">
        A free meetup collects nothing, which is the right call when you have no costs to cover. It also fills
        fastest — and no-shows are highest, because nobody has committed anything.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-2xl border border-brand/25 bg-brand/8 p-4">
      <p className="text-sm text-content/70">
        If all {safeSpots} spots fill you collect{' '}
        <span className="font-display text-xl font-semibold tabular-nums text-content">
          {formatMoney(take.ifItFills)}
        </span>
      </p>
      <p className="text-sm text-content/60">
        {formatMoney(fee)} × {safeSpots} · CampusClub takes no commission, so all of it is yours
      </p>
    </div>
  );
}

function SectionHead({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-on-brand">
        {step}
      </span>
      <h2 className="font-display text-xl font-bold text-content">{title}</h2>
    </div>
  );
}

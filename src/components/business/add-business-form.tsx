'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBusinessAction } from '@/app/actions/businesses';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { useUiStore } from '@/store/ui-store';
import { AMENITIES, CATEGORIES, CITIES, PRICE_LABELS } from '@/lib/constants';
import type { ActionResult } from '@/types';

export function AddBusinessForm() {
  const [state, formAction, pending] = useActionState<ActionResult<{ slug: string }> | null, FormData>(
    createBusinessAction,
    null,
  );
  const pushToast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  useEffect(() => {
    if (!state) return;
    if (state.ok && state.data) {
      pushToast({ title: state.message ?? 'Listed.', tone: 'success' });
      router.push(`/businesses/${state.data.slug}`);
    } else if (state.message) {
      pushToast({ title: state.message, tone: 'error' });
    }
  }, [state, pushToast, router]);

  return (
    <form action={formAction} className="surface-card space-y-6 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Business name" htmlFor="name" error={state?.fieldErrors?.name}>
          <Input id="name" name="name" placeholder="Third Wave Filter Room" required />
        </Field>

        <Field label="Category" htmlFor="categorySlug" error={state?.fieldErrors?.categorySlug}>
          <Select id="categorySlug" name="categorySlug" defaultValue="" required>
            <option value="" disabled>
              Choose one
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Description"
        htmlFor="description"
        hint="What makes it worth a detour? At least 30 characters."
        error={state?.fieldErrors?.description}
      >
        <Textarea id="description" name="description" placeholder="A narrow, sunlit room that takes filter coffee seriously…" required />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="City" htmlFor="city" error={state?.fieldErrors?.city}>
          <Select id="city" name="city" defaultValue="" required>
            <option value="" disabled>
              Choose a city
            </option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Neighbourhood" htmlFor="neighborhood" error={state?.fieldErrors?.neighborhood}>
          <Input id="neighborhood" name="neighborhood" placeholder="Indiranagar" required />
        </Field>
      </div>

      <Field label="Street address" htmlFor="address" error={state?.fieldErrors?.address}>
        <Input id="address" name="address" placeholder="12, 100 Feet Road" required />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Phone" htmlFor="phone" error={state?.fieldErrors?.phone}>
          <Input id="phone" name="phone" placeholder="+91 80 4123 8890" required />
        </Field>

        <Field label="Website" htmlFor="website" hint="Optional" error={state?.fieldErrors?.website}>
          <Input id="website" name="website" type="url" placeholder="https://…" />
        </Field>

        <Field label="Price level" htmlFor="priceLevel" error={state?.fieldErrors?.priceLevel}>
          <Select id="priceLevel" name="priceLevel" defaultValue="2">
            {[1, 2, 3, 4].map((level) => (
              <option key={level} value={level}>
                {PRICE_LABELS[level]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Amenities</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <label
              key={amenity}
              className="cursor-pointer rounded-full border border-content/15 px-3.5 py-2 text-xs font-medium transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-on-brand"
            >
              <input type="checkbox" name="amenities" value={amenity} className="sr-only" />
              {amenity}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Publishing…' : 'Publish listing'}
      </Button>
    </form>
  );
}

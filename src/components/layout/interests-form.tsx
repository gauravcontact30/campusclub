'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveInterestsAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { useUiStore } from '@/store/ui-store';
import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * The whole of onboarding: pick the things you would actually turn up to. It
 * only sorts the feed — nothing is hidden because of it, which is why it is one
 * screen and skippable rather than a six-question quiz.
 */
export function InterestsForm({ initial, redirectTo = '/meetups' }: { initial: string[]; redirectTo?: string }) {
  const [chosen, setChosen] = useState<string[]>(initial);
  const [pending, startTransition] = useTransition();
  const toast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  function save() {
    startTransition(async () => {
      const result = await saveInterestsAction(chosen);
      if (!result.ok) {
        toast({ title: result.message ?? 'Could not save that.', tone: 'error' });
        return;
      }
      router.push(redirectTo);
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map((c) => {
          const on = chosen.includes(c.slug);
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => setChosen(on ? chosen.filter((s) => s !== c.slug) : [...chosen, c.slug])}
              aria-pressed={on}
              className={cn(
                'flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                on
                  ? 'border-brand bg-brand/10'
                  : 'border-content/12 bg-canvas-700 hover:border-content/35',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  on ? 'bg-brand text-on-brand' : 'bg-content/8 text-content/60',
                )}
              >
                <CategoryIcon slug={c.slug} size={18} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-sm font-bold text-content">{c.verb}</span>
                <span className="block text-xs leading-relaxed text-content/60">{c.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" onClick={save} disabled={pending}>
          {pending ? 'Saving…' : chosen.length ? `Save ${chosen.length} and continue` : 'Continue'}
        </Button>
        <button
          type="button"
          onClick={() => router.push(redirectTo)}
          className="text-sm font-semibold text-content/60 underline decoration-content/30 underline-offset-4 hover:text-content"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

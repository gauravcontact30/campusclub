'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { toggleSaveAction } from '@/app/actions/saves';
import { useUiStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

/**
 * Optimistic on purpose: saving is cheap, reversible and frequent, so the icon
 * fills the instant it is clicked and rolls back only if the server disagrees.
 *
 * `relative z-10` matters — the card's title carries a full-bleed `::after`
 * click target, and without a stacking context of its own this button would sit
 * underneath it and never receive the click.
 */
export function SaveButton({
  meetupId,
  initialSaved,
  title,
  className,
}: {
  meetupId: string;
  initialSaved: boolean;
  title: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const toast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  function onClick() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await toggleSaveAction(meetupId);
      if (!result.ok) {
        setSaved(!next);
        toast({ title: result.message ?? 'Could not save that.', tone: 'error' });
        if (result.message?.includes('Sign in')) router.push('/login?next=/meetups');
        return;
      }
      setSaved(Boolean(result.data?.saved));
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
      className={cn(
        'relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
        saved
          ? 'border-brand/40 bg-brand/15 text-brand'
          : 'border-content/15 text-content/50 hover:border-content/40 hover:text-content',
        className,
      )}
    >
      <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}

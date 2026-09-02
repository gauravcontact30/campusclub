'use client';

import { useTransition, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { toggleSaveAction } from '@/app/actions/saves';
import { useUiStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

export function SaveButton({
  businessId,
  saved: initialSaved,
  variant = 'icon',
  className,
}: {
  businessId: string;
  saved: boolean;
  variant?: 'icon' | 'full';
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const pushToast = useUiStore((s) => s.pushToast);

  function onClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      const result = await toggleSaveAction(businessId);
      if (!result.ok) {
        pushToast({ title: result.message ?? 'Could not save', tone: 'error' });
        return;
      }
      setSaved(Boolean(result.data));
      pushToast({ title: result.message ?? '', tone: 'success' });
    });
  }

  if (variant === 'full') {
    return (
      <button
        onClick={onClick}
        disabled={pending}
        aria-pressed={saved}
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors',
          saved ? 'border-flame bg-flame/10 text-flame-700' : 'border-ink/20 text-ink hover:border-ink',
          className,
        )}
      >
        <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      aria-label={saved ? 'Remove from saved' : 'Save this place'}
      aria-pressed={saved}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full bg-cream/90 text-ink shadow-card backdrop-blur transition-transform hover:scale-105',
        saved && 'text-flame',
        className,
      )}
    >
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}

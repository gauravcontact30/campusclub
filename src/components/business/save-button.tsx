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
          saved ? 'border-orchid bg-orchid/10 text-orchid-700' : 'border-frost/20 text-frost hover:border-frost/45',
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
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-frost/20 bg-noir/70 text-frost shadow-card backdrop-blur transition-transform hover:scale-105',
        saved && 'text-orchid',
        className,
      )}
    >
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}

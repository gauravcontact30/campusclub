'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cancelBookingAction } from '@/app/actions/dinners';
import { useUiStore } from '@/store/ui-store';

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition();
  const pushToast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const result = await cancelBookingAction(bookingId);
          pushToast({
            title: result.message ?? (result.ok ? 'Cancelled' : 'Could not cancel'),
            tone: result.ok ? 'success' : 'error',
          });
          router.refresh();
        })
      }
      disabled={pending}
      className="inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-brand-700 hover:bg-brand/10"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : 'Cancel'}
    </button>
  );
}

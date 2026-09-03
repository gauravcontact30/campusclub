'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelJoinAction } from '@/app/actions/joins';
import { useUiStore } from '@/store/ui-store';
import { FREE_CANCELLATION_HOURS } from '@/lib/constants';

export function CancelJoinButton({ joinId, refundable }: { joinId: string; refundable: boolean }) {
  const [pending, startTransition] = useTransition();
  const toast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  function cancel() {
    // A destructive, paid action gets a confirm — and the confirm says which of
    // the two outcomes applies rather than a generic "are you sure".
    const message = refundable
      ? 'Cancel this join? Your fee comes back automatically.'
      : `It is under ${FREE_CANCELLATION_HOURS} hours away, so the fee is not refunded. Cancel anyway?`;
    if (!window.confirm(message)) return;

    startTransition(async () => {
      const result = await cancelJoinAction(joinId);
      toast({ title: result.message ?? 'Cancelled.', tone: result.ok ? 'success' : 'error' });
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={cancel}
      disabled={pending}
      className="text-sm font-semibold text-content/60 underline decoration-content/30 underline-offset-4 transition-colors hover:text-content disabled:opacity-50"
    >
      {pending ? 'Cancelling…' : 'Cancel'}
    </button>
  );
}

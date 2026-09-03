'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelMeetupAction } from '@/app/actions/meetups';
import { useUiStore } from '@/store/ui-store';

export function CancelMeetupButton({ meetupId, joined }: { meetupId: string; joined: number }) {
  const [pending, startTransition] = useTransition();
  const toast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  function cancel() {
    const message = joined
      ? `Cancel this meetup? ${joined} ${joined === 1 ? 'person has' : 'people have'} joined and will be refunded in full.`
      : 'Cancel this meetup? Nobody has joined yet.';
    if (!window.confirm(message)) return;

    startTransition(async () => {
      const result = await cancelMeetupAction(meetupId);
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
      {pending ? 'Cancelling…' : 'Cancel meetup'}
    </button>
  );
}

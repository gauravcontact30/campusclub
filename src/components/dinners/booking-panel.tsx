'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarCheck, Loader2, Users } from 'lucide-react';
import type { DinnerBooking, DinnerEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { bookSeatAction, cancelBookingAction } from '@/app/actions/dinners';
import { useUiStore } from '@/store/ui-store';
import { formatMoneyForCity, pluralize } from '@/lib/utils';

export function BookingPanel({
  event,
  signedIn,
  booking,
  hasQuiz,
}: {
  event: DinnerEvent;
  signedIn: boolean;
  booking: DinnerBooking | null;
  hasQuiz: boolean;
}) {
  const [current, setCurrent] = useState(booking);
  const [pending, startTransition] = useTransition();
  const pushToast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  const seatsLeft = Math.max(0, event.seatsTotal - event.seatsTaken);

  function book() {
    startTransition(async () => {
      const result = await bookSeatAction(event.id);
      if (!result.ok) {
        pushToast({ title: result.message ?? 'Could not book', tone: 'error' });
        return;
      }
      pushToast({ title: result.message ?? 'Seat confirmed', tone: 'success' });
      router.refresh();
      setCurrent({
        id: 'pending',
        eventId: event.id,
        userId: 'me',
        status: (result.data?.status as DinnerBooking['status']) ?? 'confirmed',
        seatNumber: event.seatsTaken + 1,
        createdAt: new Date().toISOString(),
      });
    });
  }

  function cancel() {
    if (!current) return;
    startTransition(async () => {
      const result = await cancelBookingAction(current.id);
      if (!result.ok) {
        pushToast({ title: result.message ?? 'Could not cancel', tone: 'error' });
        return;
      }
      pushToast({ title: result.message ?? 'Cancelled', tone: 'success' });
      setCurrent(null);
      router.refresh();
    });
  }

  return (
    <div className="surface-card space-y-5 p-6 lg:sticky lg:top-24">
      <div className="flex items-baseline justify-between">
        <p>
          <span className="font-display text-3xl font-semibold">{formatMoneyForCity(event.priceCents, event.city)}</span>
          <span className="text-sm text-ink/50"> / seat</span>
        </p>
        {current ? (
          <Badge tone={current.status === 'confirmed' ? 'sage' : 'gold'}>
            {current.status === 'confirmed' ? 'Seat confirmed' : 'On the waitlist'}
          </Badge>
        ) : (
          <Badge tone={seatsLeft ? 'flame' : 'neutral'}>
            {seatsLeft ? `${pluralize(seatsLeft, 'seat')} left` : 'Waitlist only'}
          </Badge>
        )}
      </div>

      <p className="text-sm text-ink/65">
        Covers matching, the reservation and the conversation deck. Food and drink are settled at the venue.
      </p>

      <div className="flex items-center gap-2 rounded-2xl bg-ink/5 px-4 py-3 text-sm">
        <Users size={16} className="text-ink/50" />
        {event.seatsTaken} of {event.seatsTotal} seats taken · {event.language}
      </div>

      {!signedIn ? (
        <Link
          href={`/login?next=/dinners/${event.id}`}
          className="inline-flex h-14 w-full items-center justify-center rounded-full bg-flame px-8 font-semibold text-cream hover:bg-flame-600"
        >
          Sign in to claim a seat
        </Link>
      ) : current ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border border-sage/50 bg-sage/15 px-4 py-3 text-sm">
            <CalendarCheck size={16} />
            {current.status === 'confirmed'
              ? 'You are in. Venue lands 36 hours before.'
              : 'First in line if someone drops out.'}
          </div>
          <Button variant="outline" full onClick={cancel} disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : 'Cancel my seat'}
          </Button>
        </div>
      ) : (
        <Button size="lg" full onClick={book} disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : seatsLeft ? 'Claim my seat' : 'Join the waitlist'}
        </Button>
      )}

      {signedIn && !hasQuiz && (
        <p className="rounded-2xl border border-dashed border-ink/25 px-4 py-3 text-xs leading-relaxed text-ink/60">
          You have not done the{' '}
          <Link href="/dinners/quiz" className="font-semibold text-flame-700 hover:underline">
            matching questionnaire
          </Link>{' '}
          yet — without it we seat you at random.
        </p>
      )}

      <p className="text-center text-xs text-ink/45">Free cancellation up to 24 hours before.</p>
    </div>
  );
}

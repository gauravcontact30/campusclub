import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarClock, MapPin, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { getBookingsForUser } from '@/lib/data/dinners';
import { EmptyState } from '@/components/ui/empty-state';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CancelBookingButton } from '@/components/dinners/cancel-booking-button';
import { formatDateTime, formatMoneyForCity } from '@/lib/utils';

export const metadata: Metadata = { title: 'Your dinners' };

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/bookings');

  const bookings = (await getBookingsForUser(user.id)).filter((b) => b.status !== 'cancelled');

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow">Your seat</p>
      <h1 className="display-lg mt-3">Upcoming dinners</h1>
      <p className="lede mt-3">
        Venue addresses arrive here and by email, 36 hours before the table.
      </p>

      {bookings.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No dinners booked"
            description="Tables fill by the Sunday before. Pick a Wednesday that suits you and claim a seat."
            action={<ButtonLink href="/dinners">Find a table</ButtonLink>}
          />
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {bookings.map((booking) => {
            const revealed = new Date(booking.event.venueRevealAt) <= new Date();
            return (
              <li key={booking.id} className="surface-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-ink text-cream">
                  <span className="text-[10px] uppercase tracking-widest text-cream/60">
                    {new Date(booking.event.startsAt).toLocaleDateString('en-GB', { month: 'short' })}
                  </span>
                  <span className="font-display text-3xl font-semibold leading-none">
                    {new Date(booking.event.startsAt).getDate()}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold">
                      {booking.event.city} · {booking.event.neighborhood}
                    </h2>
                    <Badge tone={booking.status === 'confirmed' ? 'sage' : 'gold'}>
                      {booking.status === 'confirmed' ? 'Confirmed' : 'Waitlisted'}
                    </Badge>
                  </div>

                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/60">
                    <span className="flex items-center gap-1.5">
                      <CalendarClock size={14} />
                      {formatDateTime(booking.event.startsAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {revealed ? booking.event.venueName : 'Venue revealed 36h before'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={14} />
                      Seat {booking.seatNumber} of {booking.event.seatsTotal}
                    </span>
                  </p>

                  <p className="mt-2 text-sm text-ink/50">Seat fee {formatMoneyForCity(booking.event.priceCents, booking.event.city)}</p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/dinners/${booking.eventId}`}
                    className="inline-flex h-11 items-center rounded-full border border-ink/20 px-5 text-sm font-semibold hover:border-ink"
                  >
                    View table
                  </Link>
                  <CancelBookingButton bookingId={booking.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

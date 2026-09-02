'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { bookSeat, cancelBooking, saveQuiz } from '@/lib/data/dinners';
import type { ActionResult, QuizAnswers } from '@/types';

export async function bookSeatAction(eventId: string): Promise<ActionResult<{ status: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Create an account to claim a seat.' };

  const booking = await bookSeat(user.id, eventId);
  revalidatePath('/dinners');
  revalidatePath(`/dinners/${eventId}`);
  revalidatePath('/bookings');

  return {
    ok: true,
    data: { status: booking.status },
    message:
      booking.status === 'confirmed'
        ? 'Seat confirmed. We reveal the venue 36 hours before.'
        : 'Table is full — you are on the waitlist and first in line.',
  };
}

export async function cancelBookingAction(bookingId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in first.' };

  await cancelBooking(user.id, bookingId);
  revalidatePath('/bookings');
  revalidatePath('/dinners');
  return { ok: true, message: 'Booking cancelled. Your seat is back in the pool.' };
}

export async function saveQuizAction(answers: QuizAnswers): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Create an account to save your matching profile.' };

  await saveQuiz(user.id, answers);
  revalidatePath('/dinners');
  revalidatePath('/profile');
  return { ok: true, message: 'Matching profile saved. You are ready to book.' };
}

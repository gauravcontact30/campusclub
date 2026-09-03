import { z } from 'zod';
import { AUDIENCES, CADENCES, CATEGORY_SLUGS, LEVELS } from '@/lib/constants';

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Passwords are at least 6 characters.'),
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, 'Tell us what to call you.'),
  city: z.string().min(2, 'Pick your city.'),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Name is required.'),
  city: z.string().min(2, 'City is required.'),
  bio: z.string().max(280, 'Keep the bio under 280 characters.').default(''),
});

/** Everything a host fills in to put a meetup on the board. */
export const meetupSchema = z.object({
  title: z.string().min(8, 'Give it a title people can picture — at least 8 characters.').max(90),
  categorySlug: z.enum(CATEGORY_SLUGS as [string, ...string[]], {
    errorMap: () => ({ message: 'Choose what kind of meetup this is.' }),
  }),
  description: z
    .string()
    .min(60, 'Say what actually happens — at least 60 characters.')
    .max(2000, 'Keep it under 2000 characters.'),
  city: z.string().min(2, 'City is required.'),
  area: z.string().min(2, 'Which neighbourhood?'),
  venueName: z.string().min(2, 'Where are you meeting?'),
  address: z.string().min(4, 'Add a street address.'),
  // datetime-local hands back "2026-09-04T18:30" — no timezone, no seconds.
  startsAt: z
    .string()
    .min(10, 'Pick a date and time.')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'That date did not parse.')
    .refine((value) => Date.parse(value) > Date.now(), 'Meetups have to start in the future.'),
  durationMins: z.coerce.number().int().min(30, 'At least 30 minutes.').max(600, 'At most 10 hours.'),
  spotsTotal: z.coerce.number().int().min(2, 'A meetup needs at least 2 spots.').max(60, 'At most 60 spots.'),
  joinFeeCents: z.coerce
    .number()
    .int()
    .min(0, 'A join fee cannot be negative.')
    .max(500000, 'Keep the join fee under ₹5,000.'),
  level: z.enum(LEVELS.map((l) => l.value) as [string, ...string[]]),
  audience: z.enum(AUDIENCES.map((a) => a.value) as [string, ...string[]]),
  language: z.string().min(2),
  cadence: z.enum(CADENCES.map((c) => c.value) as [string, ...string[]]),
  agenda: z.array(z.string().max(160)).max(8).default([]),
  bring: z.array(z.string().max(60)).max(8).default([]),
  tags: z.array(z.string().max(30)).max(6).default([]),
});

/** Feedback left after a meetup has run. */
export const vouchSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Pick a rating.').max(5),
  body: z
    .string()
    .min(40, 'Forty characters at least — what actually happened?')
    .max(2000, 'Keep it under 2000 characters.'),
  highlights: z.array(z.string().max(40)).max(6).default([]),
});

export const hostReplySchema = z.object({
  body: z
    .string()
    .min(20, 'A reply worth reading is at least 20 characters.')
    .max(1200, 'Keep replies under 1200 characters.'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type MeetupInput = z.infer<typeof meetupSchema>;
export type VouchInput = z.infer<typeof vouchSchema>;

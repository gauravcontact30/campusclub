import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Passwords are at least 6 characters.'),
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, 'Tell us what to call you.'),
  city: z.string().min(2, 'Pick your city.'),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Pick a star rating.').max(5),
  title: z.string().min(4, 'Give your review a short headline.').max(90),
  body: z.string().min(40, 'Reviews need at least 40 characters — what happened?').max(4000),
});

export const businessSchema = z.object({
  name: z.string().min(2, 'Business name is required.'),
  categorySlug: z.string().min(2, 'Choose a category.'),
  description: z.string().min(30, 'Describe the business in at least 30 characters.'),
  city: z.string().min(2, 'City is required.'),
  neighborhood: z.string().min(2, 'Neighbourhood is required.'),
  address: z.string().min(4, 'Street address is required.'),
  phone: z.string().min(6, 'Add a contact number.'),
  website: z.string().url('Add a full URL (https://…).').or(z.literal('')),
  priceLevel: z.coerce.number().int().min(1).max(4),
  amenities: z.array(z.string()).default([]),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Name is required.'),
  city: z.string().min(2, 'City is required.'),
  bio: z.string().max(280, 'Keep the bio under 280 characters.').default(''),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;

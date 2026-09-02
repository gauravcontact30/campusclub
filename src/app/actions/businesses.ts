'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { claimBusiness, createBusiness, getBusinessBySlug } from '@/lib/data/businesses';
import { businessSchema, claimSchema } from '@/lib/validators';
import type { ActionResult, PriceLevel } from '@/types';

export async function createBusinessAction(
  _prev: ActionResult<{ slug: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  const user = await getCurrentUser();

  const parsed = businessSchema.safeParse({
    name: formData.get('name'),
    categorySlug: formData.get('categorySlug'),
    description: formData.get('description'),
    city: formData.get('city'),
    neighborhood: formData.get('neighborhood'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    website: formData.get('website') ?? '',
    priceLevel: formData.get('priceLevel'),
    amenities: formData.getAll('amenities').map(String),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
    };
  }

  const business = await createBusiness({
    ...parsed.data,
    priceLevel: parsed.data.priceLevel as PriceLevel,
    ownerId: user?.id ?? null,
  });

  revalidatePath('/businesses');
  return { ok: true, data: { slug: business.slug }, message: `${business.name} is now listed.` };
}

export async function claimBusinessAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to claim a listing.' };

  const slug = String(formData.get('slug') ?? '');
  const business = await getBusinessBySlug(slug);
  if (!business) return { ok: false, message: 'That listing no longer exists.' };
  if (business.ownerId) {
    return {
      ok: false,
      message:
        business.ownerId === user.id
          ? 'You already manage this listing.'
          : 'Someone has already claimed this listing. Email support@sitnext.example to dispute it.',
    };
  }

  const parsed = claimSchema.safeParse({
    role: formData.get('role'),
    contactEmail: formData.get('contactEmail'),
    phone: formData.get('phone'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
    };
  }

  const claimed = await claimBusiness({ businessId: business.id, userId: user.id, ...parsed.data });
  if (!claimed) return { ok: false, message: 'That listing was claimed a moment ago.' };

  revalidatePath(`/businesses/${slug}`);
  revalidatePath('/profile');
  redirect(`/businesses/${slug}?claimed=1`);
}

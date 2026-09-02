'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { createBusiness } from '@/lib/data/businesses';
import { businessSchema } from '@/lib/validators';
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

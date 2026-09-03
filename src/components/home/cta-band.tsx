import { ButtonLink } from '@/components/ui/button';
import { getDictionary } from '@/lib/i18n/server';

export async function CtaBand() {
  const t = await getDictionary();

  return (
    <section className="container-page pb-20">
      <div className="surface-card overflow-hidden bg-brand/10 p-10 sm:p-14">
        <h2 className="display-lg max-w-2xl text-balance text-content">{t.cta.title}</h2>
        <p className="lede mt-4 max-w-xl">{t.cta.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/signup" size="lg">
            {t.cta.primary}
          </ButtonLink>
          <ButtonLink href="/meetups" variant="outline" size="lg">
            {t.cta.secondary}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

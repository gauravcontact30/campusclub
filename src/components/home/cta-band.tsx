import { ButtonLink } from '@/components/ui/button';
import { getDictionary } from '@/lib/i18n/server';

export async function CtaBand() {
  const t = await getDictionary();

  return (
    <section className="container-page pb-8">
      <div className="relative overflow-hidden rounded-4xl bg-brand px-6 py-16 text-center text-on-brand sm:px-12 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-signal/35 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-content/25 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="display-lg text-content">{t.cta.title}</h2>
          <p className="mt-4 text-content/85">
            {t.cta.body}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg" variant="dark">
              {t.cta.primary}
            </ButtonLink>
            <ButtonLink href="/businesses" size="lg" variant="secondary">
              {t.cta.secondary}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

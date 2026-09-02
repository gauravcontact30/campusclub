import { ButtonLink } from '@/components/ui/button';

export function CtaBand() {
  return (
    <section className="container-page pb-8">
      <div className="relative overflow-hidden rounded-4xl bg-orchid px-6 py-16 text-center text-frost sm:px-12 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-parrot/35 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-frost/25 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="display-lg text-frost">Your next Wednesday is already booked.</h2>
          <p className="mt-4 text-frost/85">
            Six questions, one table, zero small talk about the weather. Or just find somewhere brilliant for dinner
            tonight — both are on the house to start.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg" variant="dark">
              Create your account
            </ButtonLink>
            <ButtonLink href="/businesses" size="lg" variant="secondary">
              Browse places first
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

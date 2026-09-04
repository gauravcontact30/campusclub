import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-semibold text-brand">404</p>
      <h1 className="display-md mt-4">Nothing is on here.</h1>
      <p className="lede mt-3 max-w-md">
        This meetup has finished, been cancelled, or never existed. Plenty of others have not.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/meetups">See what’s on</ButtonLink>
        <ButtonLink href="/" variant="outline">
          Back home
        </ButtonLink>
      </div>
    </div>
  );
}

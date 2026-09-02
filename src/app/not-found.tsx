import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-semibold text-orchid">404</p>
      <h1 className="display-md mt-4">That table is not here.</h1>
      <p className="lede mt-3 max-w-md">
        The page you are after has moved, closed or never existed. The directory is still open, though.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/businesses">Browse places</ButtonLink>
        <ButtonLink href="/" variant="outline">
          Back home
        </ButtonLink>
      </div>
    </div>
  );
}

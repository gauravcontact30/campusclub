import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { BACKEND_MODE } from '@/lib/env';
import { authImageUrl } from '@/lib/media/auth';

/**
 * Where the visitor was going before they were asked to sign in.
 *
 * An auth wall that appears with no explanation reads as a toll gate. Naming
 * the destination turns it back into a step in something the visitor started —
 * and `?next=/host` in particular arrives from a button that said "Host one",
 * so landing on a bare "Welcome back." looks like the click went wrong.
 *
 * Unknown or same-origin-root destinations get nothing rather than a guess: a
 * wrong reassurance is worse than none.
 */
const DESTINATIONS: Record<string, string> = {
  '/host': 'listing your meetup',
  '/passes': 'your pass',
  '/saved': 'your saved meetups',
  '/my-meetups': 'your meetups',
  '/profile': 'your profile',
  '/profile/interests': 'setting up your profile',
};

export function destinationLabel(next?: string) {
  if (!next) return undefined;
  return DESTINATIONS[next];
}

/**
 * One composed object, two panels: a photograph that says where the account
 * belongs, and the form.
 *
 * Nothing else. This page carried a sales column for a while — what a join fee
 * costs, what a pass includes, the cancellation window — and all of it was
 * being read by somebody who had already decided and just wanted to get in.
 * The argument for the product belongs on the pages that make it. A door
 * should open.
 *
 * What is left is only what the act needs: where you are, where this is taking
 * you, the fields, and the way across to the other page. The heading sits at
 * `display-md` rather than `display-lg` for the same reason — a 50px serif
 * headline over two fields is a billboard nailed to a doorframe.
 */
export function AuthShell({
  title,
  subtitle,
  imageId,
  next,
  children,
}: {
  title: string;
  subtitle: string;
  /** Unsplash id for the panel photograph — see lib/media/auth.ts. */
  imageId: string;
  /** The post-auth destination, so the page can say where it is taking you. */
  next?: string;
  children: ReactNode;
}) {
  const going = destinationLabel(next);

  return (
    <div className="container-page py-8 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <Link href="/meetups" className="inline-flex items-center gap-2 text-sm text-content/60 hover:text-brand">
          <ArrowLeft size={15} aria-hidden /> Back to meetups
        </Link>

        <div className="mt-5 grid overflow-hidden rounded-3xl border border-content/10 bg-canvas-700 shadow-card md:grid-cols-[1fr_1.1fr]">
          {/* The photograph fills the panel rather than sitting in a band above
              the heading: a short landscape strip crops a room full of people
              down to a row of foreheads, and the picture stops being of
              anything.

              The type over it is white in both themes, which is the same
              decision MeetupCover makes for the same reason — a photograph is
              the one surface on the site whose brightness the palette does not
              control, so text over it cannot be a palette colour. */}
          <div className="relative flex min-h-[15rem] flex-col border-b border-content/10 bg-content md:min-h-[27rem] md:border-b-0 md:border-r">
            <Image
              src={authImageUrl(imageId)}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 24rem"
              className="object-cover"
              priority
            />
            {/* Weighted to the top third rather than spread evenly: the copy
                needs a dark base directly under it, and everything below that
                is photograph the scrim has no business dimming. Reading order
                is the reason it sits up here — the heading is the first thing
                on the page, so it should not be the last thing in the panel. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/55 via-38% to-black/5"
            />

            <div className="relative p-7 sm:p-9">
              <h1 className="display-md text-balance text-white">{title}</h1>
              <p className="mt-3 max-w-xs text-[0.95rem] leading-relaxed text-white/75">{subtitle}</p>
            </div>
          </div>

          <div className="p-7 sm:p-9">
            {going && (
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-xs font-semibold text-brand-700">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                Next up: {going}
              </p>
            )}

            {children}

            {/* Accounts are Supabase Auth and nothing else, so with no project
                configured there is no sign-in to offer. Saying so beats a form
                that fails on submit for a reason the visitor cannot see. */}
            {BACKEND_MODE === 'demo' && (
              <div className="mt-8 rounded-2xl border border-dashed border-content/25 p-4 text-xs leading-relaxed text-content/60">
                <p className="font-semibold text-content">Sign-in is currently unavailable</p>
                <p className="mt-1">
                  You can still explore meetups. Please try again later to create or access your account.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

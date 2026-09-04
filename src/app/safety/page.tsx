import type { Metadata } from 'next';
import { BadgeCheck, Eye, FileWarning, RefreshCcw, ShieldCheck, Users } from 'lucide-react';
import { PageHeader, NextUp } from '@/components/site/page-header';
import { ButtonLink } from '@/components/ui/button';
import { FREE_CANCELLATION_HOURS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Trust & safety',
  description: 'What CampusClub checks before somebody can host, what a member sees before paying, and what happens after a report.',
};

const PILLARS = [
  {
    icon: BadgeCheck,
    title: 'Verification is a real check, shown honestly',
    body: 'A verified badge means a confirmed phone number and a public rating built only from members with a confirmed, completed join. It is not a background check, and we say so — treat it as one signal among several, next to the rating and the feedback text itself.',
  },
  {
    icon: Eye,
    title: 'Nothing is hidden until you have paid something real',
    body: 'Who is already going, first names, how full the meetup is, and the host\'s full record are all visible on the listing before you commit to anything. Only the exact street address waits until after payment — it is often somebody\'s home.',
  },
  {
    icon: Users,
    title: 'Only people who actually went can rate it',
    body: 'A rating requires a confirmed join on a meetup that has already finished — enforced in the page, in the server action, and a third time in a database policy that cannot be bypassed by going around the app. That is what keeps the ratings worth reading.',
  },
  {
    icon: FileWarning,
    title: 'A report reaches a person, not a queue',
    body: 'Every report is read the same day it is filed, by trust & safety, not by an automated triage. We can act on a specific member or host independent of anything public, and repeated genuine reports lead to removal.',
  },
  {
    icon: RefreshCcw,
    title: 'The money follows the same rule either way',
    body: `Cancel more than ${FREE_CANCELLATION_HOURS} hours out and you are refunded automatically. If a host cancels, or is removed for cause, everyone who joined is refunded in full — there is no discretion in either direction.`,
  },
  {
    icon: ShieldCheck,
    title: 'Open to everyone, and open to saying so',
    body: 'A host can set a meetup to women only, in any activity, at the point of listing. It is the host\'s choice, not a filter we quietly apply, and it is visible on the card before anyone clicks in.',
  },
];

export default function SafetyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trust & safety"
        title="What we check, stated plainly."
        lede="A platform that oversells its own safety is worse than one that describes it accurately. Here is exactly what CampusClub verifies, what it does not, and what happens when something goes wrong."
        actions={
          <>
            <ButtonLink href="/contact" size="lg">
              Report something
            </ButtonLink>
            <ButtonLink href="/help#safety" variant="outline" size="lg">
              Safety FAQ
            </ButtonLink>
          </>
        }
      />

      <div className="container-page py-14">
        <ul className="grid gap-6 md:grid-cols-2">
          {PILLARS.map((p) => (
            <li key={p.title} className="surface-card flex min-w-0 flex-col gap-3 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <p.icon size={19} />
              </span>
              <h2 className="font-display text-lg font-semibold text-content">{p.title}</h2>
              <p className="text-sm leading-relaxed text-content/75">{p.body}</p>
            </li>
          ))}
        </ul>

        <section className="surface-card mt-10 space-y-3 p-6 sm:p-8" aria-labelledby="not-heading">
          <h2 id="not-heading" className="font-display text-xl font-semibold text-content">
            What &ldquo;verified&rdquo; is not
          </h2>
          <p className="text-[0.95rem] leading-relaxed text-content/75">
            It is not a criminal background check, and we do not claim it is one anywhere on the site. It confirms a
            working phone number and reflects a genuine attendance history. Use your own judgement the way you would
            meeting anyone new — public venues first, and tell someone where you are going.
          </p>
        </section>
      </div>

      <NextUp
        links={[
          { href: '/legal/refunds', label: 'Refund policy', blurb: 'The cancellation rule, written out in full.' },
          { href: '/legal/privacy', label: 'Privacy policy', blurb: 'What we collect, and what we never sell.' },
          { href: '/how-it-works', label: 'How it works', blurb: 'The four steps from finding a meetup to feedback.' },
        ]}
      />
    </>
  );
}

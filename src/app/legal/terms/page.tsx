import type { Metadata } from 'next';
import { PageHeader, Prose, Revised, NextUp } from '@/components/site/page-header';
import { CATEGORIES, CITIES, FREE_CANCELLATION_HOURS, SITE } from '@/lib/constants';

export const metadata: Metadata = { title: 'Terms of service' };

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of service" />
      <div className="container-page py-14">
        <Revised date="3 September 2026" />
        <Prose>
          <p>
            These terms govern your use of {SITE.name} — the website, and the meetups listed, joined and hosted
            through it. By creating an account or joining a meetup you agree to them. If you host a meetup, the
            sections on hosting apply to you as well as the sections on joining.
          </p>

          <h2>1. What {SITE.name} is, and is not</h2>
          <p>
            {SITE.name} is a marketplace connecting members who want to do something — {CATEGORIES.map((c) => c.name.toLowerCase()).join(', ')}
            {' '}and more — with hosts running that thing nearby, currently across {CITIES.length} cities. We provide
            the listing, the payment processing, the waitlist and the refund mechanism. We do not organise, staff, or
            supervise any meetup ourselves, and we are not a party to the arrangement a host makes with the people
            who join.
          </p>

          <h2>2. Accounts</h2>
          <p>
            You must be at least 18 to create an account. You are responsible for what happens under your account,
            including any meetup you host and any payment you authorise. Give us an accurate name and city — a host&rsquo;s
            record and a member&rsquo;s booking depend on both being real.
          </p>

          <h2>3. Joining a meetup</h2>
          <p>
            Joining a meetup means paying that meetup&rsquo;s join fee, shown on the listing before you commit to anything.
            Payment confirms your spot, or places you on a free waitlist if the meetup is already full — nothing is
            charged for a waitlist place until a spot opens and you take it. The exact venue address is released to
            you once your join is confirmed.
          </p>
          <p>
            Cancelling more than {FREE_CANCELLATION_HOURS} hours before a meetup starts refunds the join fee, or
            returns a spent pass credit, automatically. Cancelling inside that window does not — see the{' '}
            <a href="/legal/refunds">refund policy</a> for the full mechanics, including what happens when a host
            cancels.
          </p>

          <h2>4. Hosting a meetup</h2>
          <p>
            Hosting is free. You set the activity, the venue, the spots available and the join fee, and you keep the
            entire fee — {SITE.name} takes no commission. You are responsible for the meetup actually happening as
            described: starting close to the listed time, at the listed venue, open to the number of people the
            listing says it is.
          </p>
          <p>
            A host who cancels a confirmed meetup must do so through the platform, which refunds every joined member
            in full automatically. Repeated late cancellations, no-shows as a host, or listings that misrepresent
            what the meetup actually is are grounds for removal from the platform.
          </p>

          <h2>5. Feedback and ratings</h2>
          <p>
            Only a member with a confirmed join on a meetup that has finished may leave feedback on it. Feedback must
            describe your genuine experience. We may remove feedback that is abusive, that identifies someone by
            information not relevant to the meetup, or that we determine was not left by someone who actually
            attended.
          </p>

          <h2>6. Conduct</h2>
          <p>
            You agree not to use {SITE.name} to harass, discriminate against, endanger, or defraud another member or
            host. Reports of conduct that breaches this are read by trust &amp; safety the same day they are filed —
            see the <a href="/safety">trust &amp; safety page</a>. We may suspend or remove an account for a breach
            of this section without a refund of past join fees for meetups already attended.
          </p>

          <h2>7. Payments</h2>
          <p>
            Payments are processed by Razorpay. We do not store your full card details. A join is only ever recorded
            once a payment has been verified as genuine — see the <a href="/legal/privacy">privacy policy</a> for
            what payment metadata we do keep and why.
          </p>

          <h2>8. Liability</h2>
          <p>
            {SITE.name} is a platform connecting members with hosts; we are not responsible for the conduct of a host
            or another member at a meetup, for injury, loss or damage arising from attending one, or for a venue&rsquo;s
            own policies. Use the judgement you would meeting anyone new, and report anything that concerns you.
          </p>

          <h2>9. Changes to these terms</h2>
          <p>
            We may update these terms as the product changes. A material change will be emailed to active members
            before it takes effect; continuing to use {SITE.name} after that point means you accept the update.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about these terms: <a href="mailto:support@campusclub.app">support@campusclub.app</a>.
          </p>
        </Prose>
      </div>
      <NextUp
        links={[
          { href: '/legal/refunds', label: 'Refund policy', blurb: 'The cancellation window, worked through in detail.' },
          { href: '/legal/privacy', label: 'Privacy policy', blurb: 'What data joining or hosting actually creates.' },
          { href: '/safety', label: 'Trust & safety', blurb: 'What we check, and how a report is handled.' },
        ]}
      />
    </>
  );
}

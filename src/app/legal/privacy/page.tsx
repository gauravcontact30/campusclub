import type { Metadata } from 'next';
import { PageHeader, Prose, Revised, NextUp } from '@/components/site/page-header';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = { title: 'Privacy policy' };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy policy" />
      <div className="container-page py-14">
        <Revised date="3 September 2026" />
        <Prose>
          <p>
            This describes what {SITE.name} collects when you use the site, why, how long we keep it, and what we
            never do with it. It applies whether you are joining meetups, hosting them, or just browsing.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li><strong>Account details</strong> — name, email, city, and a bio if you add one.</li>
            <li><strong>Activity</strong> — the meetups you join, host, save or leave feedback on.</li>
            <li><strong>Payment metadata</strong> — the amount, the order and payment IDs, and the status of a
              transaction. Your card or UPI details are handled directly by Razorpay and never touch our servers.</li>
            <li><strong>Location, only if you grant it</strong> — used once, to sort the board by distance, and never
              stored against your account.</li>
            <li><strong>Basic technical data</strong> — the kind any web server logs: IP address, browser, and pages
              visited, kept briefly for security and to keep the assistant&rsquo;s rate limiting honest.</li>
          </ul>

          <h2>Why we collect it</h2>
          <p>
            To run the product: to show you meetups, to process a join and its payment, to let a host see who is
            coming, to enforce the rule that only attendees can leave feedback, and to email you about a meetup you
            have joined or hosted. We do not collect anything beyond what one of those purposes needs.
          </p>

          <h2>Who sees what</h2>
          <p>
            Other members see your first name, avatar and (once you join) whether you are attending a meetup they
            are also attending. A host sees the first names of people who joined their meetup, not full details. We
            never sell personal data, and we do not share it with advertisers — {SITE.name} does not run
            third-party ad tracking.
          </p>
          <p>
            We share payment data with Razorpay to process a transaction, and we may share data with a court order
            or where the law requires it. That is the complete list of third parties who ever see personal data.
          </p>

          <h2>The assistant</h2>
          <p>
            Questions you ask the CampusClub assistant are sent to Anthropic to generate an answer, together with
            whatever the assistant looked up from our own meetup data to answer you. We do not send your account
            identity, payment history or saved meetups into that conversation.
          </p>

          <h2>How long we keep it</h2>
          <p>
            Account data for as long as your account is active. Completed transaction records for as long as tax and
            payments law in India requires — currently up to eight years — even after an account is deleted, because
            we are legally required to be able to produce them. Everything else tied to a deleted account is removed
            within 30 days.
          </p>

          <h2>Your choices</h2>
          <p>
            You can edit your name, city and bio from your profile at any time. To export or delete your data, write
            to <a href="mailto:privacy@campusclub.app">privacy@campusclub.app</a> — we will confirm what is retained
            for legal reasons (see above) and remove the rest within 30 days.
          </p>

          <h2>Cookies</h2>
          <p>
            See the <a href="/legal/cookies">cookie policy</a> for the specific cookies the site sets — there are
            four, and none of them are for advertising.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            A material change to what we collect or why will be emailed to active members before it takes effect.
          </p>

          <h2>Contact</h2>
          <p>
            <a href="mailto:privacy@campusclub.app">privacy@campusclub.app</a> for anything about your data
            specifically.
          </p>
        </Prose>
      </div>
      <NextUp
        links={[
          { href: '/legal/cookies', label: 'Cookie policy', blurb: 'The four cookies the site sets, named individually.' },
          { href: '/legal/terms', label: 'Terms of service', blurb: 'The full agreement for using CampusClub.' },
          { href: '/safety', label: 'Trust & safety', blurb: 'What we check before someone can host.' },
        ]}
      />
    </>
  );
}

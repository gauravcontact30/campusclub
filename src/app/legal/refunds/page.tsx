import type { Metadata } from 'next';
import { PageHeader, Prose, Revised, NextUp } from '@/components/site/page-header';
import { FREE_CANCELLATION_HOURS, SITE } from '@/lib/constants';

export const metadata: Metadata = { title: 'Refund policy' };

export default function RefundsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Refund policy" />
      <div className="container-page py-14">
        <Revised date="3 September 2026" />
        <Prose>
          <p>
            This is the full, written version of the one rule that governs every join fee paid on {SITE.name}. The
            same rule applies whether you paid with a card, UPI, or a pass credit.
          </p>

          <h2>The {FREE_CANCELLATION_HOURS}-hour window</h2>
          <p>
            Cancel a confirmed join more than {FREE_CANCELLATION_HOURS} hours before the meetup&rsquo;s start time and you
            are refunded automatically — the full join fee back to your original payment method, or the credit
            returned to your pass balance if that is what you used. There is no form to fill in and no approval
            step; cancelling from &ldquo;Your meetups&rdquo; triggers it immediately.
          </p>
          <p>
            Cancel inside that {FREE_CANCELLATION_HOURS}-hour window and the fee is not refunded. This is because the
            host has, by that point, almost always already paid for the venue, the court, or the food based on the
            spots confirmed — a late cancellation is a real cost to them, not just an inconvenience.
          </p>

          <h2>When a host cancels</h2>
          <p>
            If a host cancels a meetup for any reason, every member with a confirmed join is refunded in full,
            automatically, regardless of how close to the start time the cancellation happens. There is no exception
            to this and no discretion applied by us or by the host.
          </p>

          <h2>Waitlists</h2>
          <p>
            Joining a full meetup&rsquo;s waitlist never charges you anything. If a spot opens and is offered to you, you
            are only charged at that point — and from that moment, the same {FREE_CANCELLATION_HOURS}-hour window
            applies to your confirmed spot as it would to anyone else&rsquo;s.
          </p>

          <h2>Pass credits</h2>
          <p>
            A credit spent to cover a join is refunded to your pass balance under the identical rule: outside the
            window it returns automatically, inside it, it does not. Credits themselves — the pass purchase — are
            billed monthly and are not refundable mid-cycle, though you can switch to a smaller pass or to
            pay-as-you-go at any time for the next cycle.
          </p>

          <h2>Disputed charges</h2>
          <p>
            If you believe a charge was made in error — a duplicate payment, a join you did not make — write to{' '}
            <a href="mailto:support@campusclub.app">support@campusclub.app</a> with the payment reference from your
            confirmation email. We investigate and resolve genuine payment errors outside the standard cancellation
            window, because those are not cancellations — they are mistakes, and we fix mistakes.
          </p>

          <h2>How long a refund takes to appear</h2>
          <p>
            Once triggered, a refund is issued to Razorpay immediately on our side. Razorpay&rsquo;s own processing back to
            your card or UPI account typically takes 5–7 working days, which is outside our control and set by the
            payment network, not by us.
          </p>
        </Prose>
      </div>
      <NextUp
        links={[
          { href: '/legal/terms', label: 'Terms of service', blurb: 'The agreement this policy sits inside.' },
          { href: '/help#joining', label: 'Help: joining & paying', blurb: 'Shorter answers to the same questions.' },
          { href: '/contact', label: 'Contact support', blurb: 'For anything this page did not cover.' },
        ]}
      />
    </>
  );
}

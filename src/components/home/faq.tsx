import Link from 'next/link';

const FAQS = [
  {
    q: 'Do I have to buy a subscription?',
    a: 'No. The default is paying the join fee for the one meetup you want, and nothing else. Passes exist because people who go three times a week end up wanting them — they pre-buy joins at a lower unit price. You can use CampusClub for a year without ever holding one.',
  },
  {
    q: 'What does the join fee actually pay for?',
    a: 'The host’s real costs: court hire, a gym day pass, the study room, the food. Hosts set their own fee and the listing shows exactly what is included. Meetups where the fee looks like profit get very few joins, which sorts it out faster than any rule we could write.',
  },
  {
    q: 'Can I get my money back?',
    a: 'Cancel more than six hours before it starts and the fee comes back automatically. Inside six hours it does not, because the host has usually already paid for the court or the table. If a host cancels, everyone is refunded in full, always.',
  },
  {
    q: 'What if the meetup is full?',
    a: 'Join the waitlist — it costs nothing. You are only charged if a spot opens up and you take it. Pass holders move up the waitlist first.',
  },
  {
    q: 'Is it safe to meet strangers?',
    a: 'Every host has a verified phone number and a public rating from people who actually attended. Meetups happen in public venues, the attendee list is visible before you commit, and there are women-only options in every category. Report anything and we act the same day.',
  },
  {
    q: 'Can I host something myself?',
    a: 'Yes, and it is free to list. Set the spots and the fee, and we handle the payments, the waitlist and the refunds. Most hosts start by putting the thing they were already doing alone on the board.',
  },
];

/**
 * `compact` shows the four questions people actually ask before their first
 * join and links out; the full set lives on /help. The same array feeds both,
 * so an answer is never edited in one place and stale in the other.
 */
export function Faq({ compact = false }: { compact?: boolean }) {
  const shown = compact ? FAQS.slice(0, 4) : FAQS;

  return (
    <section className="container-page py-20" aria-labelledby="faq-heading">
      <p className="eyebrow">Straight answers</p>
      <h2 id="faq-heading" className="display-lg mt-3 text-balance text-content">
        The things people ask before joining.
      </h2>

      <dl className="mt-10 divide-y divide-content/12 border-y border-content/12">
        {shown.map((faq) => (
          <div key={faq.q} className="grid gap-2 py-6 md:grid-cols-[0.9fr_1.1fr] md:gap-8">
            <dt className="font-display text-lg font-semibold text-content">{faq.q}</dt>
            <dd className="text-[0.95rem] leading-relaxed text-content/70">{faq.a}</dd>
          </div>
        ))}
      </dl>

      {compact && (
        <Link href="/help" className="link-underline mt-8 inline-block font-semibold text-content">
          Everything else, on one page →
        </Link>
      )}
    </section>
  );
}

export { FAQS };

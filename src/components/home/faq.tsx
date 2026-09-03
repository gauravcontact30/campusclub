const FAQS = [
  {
    q: 'Do I have to buy a subscription?',
    a: 'No. The default is paying the join fee for the one meetup you want, and nothing else. Passes exist because people who go three times a week end up wanting them — they pre-buy joins at a lower unit price. You can use VibeClub for a year without ever holding one.',
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

export function Faq() {
  return (
    <section className="container-page py-20" aria-labelledby="faq-heading">
      <p className="eyebrow">Straight answers</p>
      <h2 id="faq-heading" className="display-lg mt-2 text-content">
        The things people ask before joining.
      </h2>

      <dl className="mt-10 grid gap-4 md:grid-cols-2">
        {FAQS.map((faq) => (
          <div key={faq.q} className="surface-card p-6">
            <dt className="font-display text-base font-bold text-content">{faq.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-content/70">{faq.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

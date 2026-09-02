'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Who else is at the table?',
    a: 'Five people matched to you on conversational energy, language, age spread and what you like to talk about. We never seat colleagues or exes together — you can block a contact before the reveal.',
  },
  {
    q: 'How do I know where to go?',
    a: 'The venue is revealed 36 hours before the dinner, by email and in your bookings page. It is always somewhere with a strong review record on HomeMart itself.',
  },
  {
    q: 'What does it cost?',
    a: 'The seat fee covers the matching and the reservation. Food and drink are paid at the venue, split however the table decides. Membership plans bring the per-seat price down.',
  },
  {
    q: 'Are the reviews moderated?',
    a: 'Every review is tied to a verified account, one per business, editable but never anonymous to us. Owners can respond publicly once they have claimed the listing.',
  },
  {
    q: 'Can I list my own business?',
    a: 'Yes — add it from the "List your business" page. Claiming gives you the response tools, opening hours control and a claimed badge on your card.',
  },
  {
    q: 'What if I need to cancel?',
    a: 'Cancel up to 24 hours before and the seat goes back to the waitlist at no charge. After that we hold the seat fee, because the venue is already holding the table.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="container-page py-20 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Questions</p>
          <h2 className="display-lg mt-3">Before you book.</h2>
          <p className="lede mt-4">
            Still unsure? Everything else lives in{' '}
            <a href="/how-it-works" className="link-underline">
              how it works
            </a>
            .
          </p>
        </div>

        <dl className="divide-y divide-ink/10 border-y border-ink/10">
          {FAQS.map((faq, i) => (
            <div key={faq.q}>
              <dt>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-lg font-semibold hover:text-flame"
                >
                  {faq.q}
                  {open === i ? <Minus size={18} className="shrink-0" /> : <Plus size={18} className="shrink-0" />}
                </button>
              </dt>
              {open === i && (
                <dd className="animate-fade-in pb-5 text-sm leading-relaxed text-ink/65">{faq.a}</dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

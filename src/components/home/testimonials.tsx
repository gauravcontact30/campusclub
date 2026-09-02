import { Quote } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

const QUOTES = [
  {
    name: 'Priya N.',
    city: 'Mumbai',
    avatar: '/img/avatars/a-02.svg',
    text: 'I moved cities for work and knew four people. Six dinners later I have a running group, a dentist I trust and a standing Thursday.',
  },
  {
    name: 'Daniel O.',
    city: 'London',
    avatar: '/img/avatars/a-03.svg',
    text: 'The reviews are the honest kind — people write about the twenty minutes they waited, not just the photogenic plate.',
  },
  {
    name: 'Sofia A.',
    city: 'Lisbon',
    avatar: '/img/avatars/a-04.svg',
    text: 'I was terrified for about four minutes. Then someone asked what I would do with a free year and we closed the place.',
  },
  {
    name: 'Kabir S.',
    city: 'Bengaluru',
    avatar: '/img/avatars/a-08.svg',
    text: 'As an owner, claiming my listing took a minute and the review volume tripled. The traffic is real people, not bots.',
  },
];

export function Testimonials() {
  return (
    <section className="container-page py-20 sm:py-24">
      <div className="max-w-2xl">
        <p className="eyebrow">From the table</p>
        <h2 className="display-lg mt-3">People who came for dinner and stayed for the city.</h2>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {QUOTES.map((quote) => (
          <figure key={quote.name} className="surface-card flex h-full flex-col p-6">
            <Quote size={22} className="text-rouge" />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-pearl/75">“{quote.text}”</blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t border-pearl/10 pt-4">
              <Avatar name={quote.name} src={quote.avatar} size={36} />
              <div>
                <p className="text-sm font-semibold">{quote.name}</p>
                <p className="text-xs text-pearl/55">{quote.city}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

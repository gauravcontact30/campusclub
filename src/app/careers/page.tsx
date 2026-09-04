import type { Metadata } from 'next';
import { Code2, HeartHandshake, MapPin, MessagesSquare } from 'lucide-react';
import { PageHeader, NextUp } from '@/components/site/page-header';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Small team, six cities, one product decision that keeps paying off: charge for the thing, and the rest follows.',
};

const VALUES = [
  {
    title: 'Ship the thing, watch what happens, believe the data over the plan',
    body: 'We turned off a recommendation engine that raised one metric and quietly broke another. The postmortem for that is on the stories page — read it before you apply, it is a fair sample of how we decide things here.',
  },
  {
    title: 'The rule that matters most is enforced three times, not once',
    body: 'Only attendees can rate a meetup — checked on the page, in the server action, and in a database policy that holds even if someone skips the app entirely. That is the standard for anything load-bearing.',
  },
  {
    title: 'Small team, and we would like to keep it that way for a while',
    body: 'Everyone here has hosted a meetup on the actual product, under their own name, with strangers who paid actual money to show up. It changes how you build the join flow.',
  },
];

interface Role {
  title: string;
  team: string;
  location: string;
  blurb: string;
}

const ROLES: Role[] = [
  {
    title: 'Founding backend engineer',
    team: 'Engineering',
    location: 'Bengaluru, or remote within India',
    blurb: 'Own the payments and joins pipeline end to end — order creation, signature verification, the webhook path, the credit ledger. Postgres, Next.js Server Actions, Razorpay.',
  },
  {
    title: 'Community lead — Delhi NCR',
    team: 'Community',
    location: 'Delhi',
    blurb: 'Recruit and support hosts across your city, run the ambassador programme locally, and be the first line on trust & safety reports that come out of Delhi meetups.',
  },
  {
    title: 'Product designer',
    team: 'Design',
    location: 'Bengaluru, or remote within India',
    blurb: 'The board, the join panel and the host form are the whole product. Come make paying to meet a stranger feel obviously worth it, in a few taps, on a slow phone.',
  },
  {
    title: 'Growth marketer — campus channel',
    team: 'Marketing',
    location: 'Remote within India',
    blurb: 'Turn the ambassador programme into a repeatable playbook: what makes a campus launch work, written down well enough that the fifth city does not need us on a call.',
  },
];

export default function CareersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Careers"
        title="We are a small team solving one specific problem."
        lede="People near each other, doing the same thing alone, with no reason to say so out loud — and a join fee that turns out to be the fix, not the friction. If that sentence makes sense to you, the rest usually does too."
      />

      <div className="container-page py-14">
        <section aria-labelledby="values-heading">
          <h2 id="values-heading" className="display-md text-content">
            How we actually decide things
          </h2>
          <ul className="mt-6 space-y-px">
            {VALUES.map((v) => (
              <li key={v.title} className="border-t border-content/12 py-6 first:border-t-0 first:pt-0">
                <h3 className="font-display text-lg font-semibold text-content">{v.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-content/75">{v.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="roles-heading">
          <h2 id="roles-heading" className="display-md text-content">
            Open roles
          </h2>
          <ul className="mt-6 space-y-4">
            {ROLES.map((role) => (
              <li key={role.title} className="surface-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-content">{role.title}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-content/60">
                      <span className="inline-flex items-center gap-1.5">
                        <Code2 size={13} /> {role.team}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} /> {role.location}
                      </span>
                    </p>
                  </div>
                  <Badge tone="brand">Hiring</Badge>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-content/75">{role.blurb}</p>
                <a
                  href="mailto:careers@campusclub.app"
                  className="mt-4 inline-flex items-center gap-2 font-semibold text-brand hover:underline"
                >
                  <MessagesSquare size={15} /> Write to careers@campusclub.app with the role in the subject
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 flex items-start gap-3 text-sm leading-relaxed text-content/60">
          <HeartHandshake size={18} className="mt-0.5 shrink-0 text-brand" />
          Nothing here fits but you think you should be doing this anyway — write to us. Several people on the team
          started as hosts before they had a job here.
        </p>
      </div>

      <NextUp
        links={[
          { href: '/about', label: 'About CampusClub', blurb: 'Where this started, and what changed along the way.' },
          { href: '/ambassadors', label: 'Campus ambassadors', blurb: 'Part-time, campus-based, and how most of the team started.' },
          { href: '/press', label: 'Press', blurb: 'What we look like from the outside.' },
        ]}
      />
    </>
  );
}

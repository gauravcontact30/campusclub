import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/site/page-header';
import { Badge } from '@/components/ui/badge';
import { STORIES } from '@/lib/content/stories';
import { formatDay } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Stories',
  description: 'How we build CampusClub and why: field notes from the data, member stories, and the reasoning behind the model.',
};

export default function StoriesPage() {
  const [lead, ...rest] = STORIES;

  return (
    <>
      <PageHeader
        eyebrow="Stories"
        title="What we notice, and why we built it that way."
        lede="Field notes from the data, the reasoning behind the join fee, and the people running the meetups that made us build any of this in the first place."
      />

      <div className="container-page py-14">
        <Link
          href={`/stories/${lead.slug}`}
          className="group grid gap-6 border-b border-content/12 pb-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-14"
        >
          <div className="flex h-56 items-center justify-center rounded-3xl bg-brand/8 p-10 lg:h-72">
            <Badge tone="brand">{lead.tag}</Badge>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-content/45">
              {formatDay(lead.publishedAt)} · {lead.readingMinutes} min read
            </p>
            <h2 className="display-lg mt-3 text-balance text-content group-hover:text-brand">{lead.title}</h2>
            <p className="lede mt-4">{lead.standfirst}</p>
            <p className="mt-5 text-sm font-semibold text-content/70">
              {lead.author} · {lead.role}, {lead.city}
            </p>
          </div>
        </Link>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((story) => (
            <li key={story.slug}>
              <Link href={`/stories/${story.slug}`} className="group flex h-full min-w-0 flex-col gap-3">
                <Badge className="w-fit">{story.tag}</Badge>
                <h3 className="font-display text-xl font-semibold leading-snug text-content group-hover:text-brand">
                  {story.title}
                </h3>
                <p className="text-sm leading-relaxed text-content/70">{story.standfirst}</p>
                <p className="mt-auto pt-2 text-xs font-medium text-content/50">
                  {story.author} · {formatDay(story.publishedAt)} · {story.readingMinutes} min
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

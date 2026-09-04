import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NextUp } from '@/components/site/page-header';
import { Badge } from '@/components/ui/badge';
import { STORIES, storyBySlug, type Block } from '@/lib/content/stories';
import { SITE } from '@/lib/constants';
import { formatDay } from '@/lib/utils';

export function generateStaticParams() {
  return STORIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = storyBySlug(slug);
  if (!story) return { title: 'Story not found' };
  return {
    title: story.title,
    description: story.standfirst,
    openGraph: { title: `${story.title} · ${SITE.name}`, description: story.standfirst, type: 'article' },
  };
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'h2':
      return <h2 className="mt-10 font-display text-2xl font-semibold text-content">{block.text}</h2>;
    case 'quote':
      return (
        <blockquote className="my-8 border-l-2 border-brand pl-6">
          <p className="font-display text-xl font-medium leading-snug text-content">“{block.text}”</p>
          <cite className="mt-2 block text-sm not-italic text-content/55">— {block.who}</cite>
        </blockquote>
      );
    case 'list':
      return (
        <ul className="space-y-2.5 pl-5">
          {block.items.map((item) => (
            <li key={item} className="list-disc marker:text-brand">
              {item}
            </li>
          ))}
        </ul>
      );
    default:
      return <p>{block.text}</p>;
  }
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = storyBySlug(slug);
  if (!story) notFound();

  const more = STORIES.filter((s) => s.slug !== story.slug && s.tag === story.tag).slice(0, 3);
  const fallback = STORIES.filter((s) => s.slug !== story.slug).slice(0, 3);
  const related = more.length ? more : fallback;

  return (
    <>
      <article className="container-page max-w-[42rem] py-14 sm:py-20">
        <nav aria-label="Breadcrumb" className="text-sm text-content/55">
          <Link href="/stories" className="hover:text-content">
            Stories
          </Link>
        </nav>

        <Badge tone="brand" className="mt-6">
          {story.tag}
        </Badge>
        <h1 className="display-lg mt-4 text-balance text-content">{story.title}</h1>
        <p className="lede mt-4">{story.standfirst}</p>

        <div className="mt-6 flex items-center gap-3 border-y border-content/12 py-4 text-sm text-content/60">
          <span className="font-semibold text-content">{story.author}</span>
          <span>{story.role}, {story.city}</span>
          <span aria-hidden>·</span>
          <span>{formatDay(story.publishedAt)}</span>
          <span aria-hidden>·</span>
          <span>{story.readingMinutes} min read</span>
        </div>

        <div className="mt-8 space-y-5 text-[1.02rem] leading-relaxed text-content/85">
          {story.body.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <NextUp
          links={related.map((s) => ({
            href: `/stories/${s.slug}`,
            label: s.title,
            blurb: s.standfirst,
          }))}
        />
      )}
    </>
  );
}

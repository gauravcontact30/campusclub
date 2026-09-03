import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, Clock, Globe, MapPin, Repeat, ShieldCheck, Users } from 'lucide-react';
import { getMeetupBySlug, searchMeetups } from '@/lib/data/meetups';
import { getVouches } from '@/lib/data/vouches';
import { getAttendees, getJoin } from '@/lib/data/joins';
import { getCurrentUser } from '@/lib/auth/session';
import { getSavedMeetupIds } from '@/lib/data/saves';
import { JoinPanel } from '@/components/meetups/join-panel';
import { HostCard } from '@/components/meetups/host-card';
import { AttendeeStrip } from '@/components/meetups/attendee-strip';
import { VouchList, VouchSummary } from '@/components/meetups/vouch-list';
import { SaveButton } from '@/components/meetups/save-button';
import { MeetupCard } from '@/components/meetups/meetup-card';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Badge } from '@/components/ui/badge';
import { AUDIENCES, categoryBySlug, LEVELS, SITE } from '@/lib/constants';
import { durationLabel, formatDateTime, formatTime } from '@/lib/utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meetup = await getMeetupBySlug(slug);
  if (!meetup) return { title: 'Meetup not found' };

  return {
    title: meetup.title,
    description: meetup.description.slice(0, 160),
    openGraph: {
      title: `${meetup.title} · ${SITE.name}`,
      description: meetup.description.slice(0, 200),
      type: 'article',
    },
  };
}

export default async function MeetupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meetup = await getMeetupBySlug(slug);
  if (!meetup) notFound();

  const user = await getCurrentUser();
  const [vouches, attendees, join, savedIds, nearby] = await Promise.all([
    getVouches(meetup.id),
    getAttendees(meetup.id),
    user ? getJoin(user.id, meetup.id) : Promise.resolve(null),
    user ? getSavedMeetupIds(user.id) : Promise.resolve<string[]>([]),
    searchMeetups({ city: meetup.city, category: meetup.categorySlug, perPage: 4, hasSpots: true }),
  ]);

  const category = categoryBySlug(meetup.categorySlug);
  const level = LEVELS.find((l) => l.value === meetup.level);
  const audience = AUDIENCES.find((a) => a.value === meetup.audience);
  const others = nearby.items.filter((m) => m.id !== meetup.id).slice(0, 3);

  return (
    <article className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-content/55">
        <Link href="/meetups" className="hover:text-content">
          What’s on
        </Link>
        <span aria-hidden> / </span>
        <Link href={`/meetups?category=${meetup.categorySlug}`} className="hover:text-content">
          {category?.name}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="min-w-0 space-y-10">
          <header className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">
                <CategoryIcon slug={meetup.categorySlug} size={13} />
                {category?.name}
              </Badge>
              {level && meetup.level !== 'any' && <Badge>{level.label}</Badge>}
              {meetup.audience !== 'everyone' && audience && <Badge tone="signal">{audience.label}</Badge>}
              {meetup.cadence !== 'once' && (
                <Badge>
                  <Repeat size={12} />
                  {meetup.cadence === 'weekly' ? 'Every week' : 'Every weekday'}
                </Badge>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <h1 className="display-lg text-balance text-content">{meetup.title}</h1>
              <SaveButton
                meetupId={meetup.id}
                initialSaved={savedIds.includes(meetup.id)}
                title={meetup.title}
                className="mt-1 h-11 w-11 shrink-0"
              />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact icon={CalendarDays} label="When">
                {formatDateTime(meetup.startsAt)} – {formatTime(meetup.endsAt)}
              </Fact>
              <Fact icon={Clock} label="Runs for">
                {durationLabel(meetup.startsAt, meetup.endsAt)}
              </Fact>
              <Fact icon={MapPin} label="Where">
                {meetup.venueName}, {meetup.area}, {meetup.city}
              </Fact>
              <Fact icon={Globe} label="Language">
                {meetup.language}
              </Fact>
            </dl>
          </header>

          <section aria-labelledby="about-heading" className="space-y-4">
            <h2 id="about-heading" className="display-md text-content">
              About this meetup
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-content/80">{meetup.description}</p>
            {meetup.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {meetup.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            )}
          </section>

          {meetup.agenda.length > 0 && (
            <section aria-labelledby="agenda-heading" className="space-y-4">
              <h2 id="agenda-heading" className="display-md text-content">
                What happens
              </h2>
              {/* An ordered list because it is genuinely ordered — the timings
                  only make sense read top to bottom. */}
              <ol className="space-y-3">
                {meetup.agenda.map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/12 text-xs font-bold tabular-nums text-brand">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-content/80">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {meetup.bring.length > 0 && (
            <section aria-labelledby="bring-heading" className="space-y-3">
              <h2 id="bring-heading" className="display-md text-content">
                Bring
              </h2>
              <div className="flex flex-wrap gap-2">
                {meetup.bring.map((item) => (
                  <Badge key={item} tone="dark">
                    {item}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="who-heading" className="space-y-4">
            <h2 id="who-heading" className="display-md flex items-center gap-2 text-content">
              <Users size={22} className="text-brand" /> Who is coming
            </h2>
            <AttendeeStrip attendees={attendees} spotsTotal={meetup.spotsTotal} />
            {/* The street address is deliberately withheld until someone joins:
                it is the host's home often enough that publishing it would be
                a real risk, and the area plus venue name is enough to decide. */}
            {join ? (
              <p className="rounded-2xl border border-brand/30 bg-brand/8 p-4 text-sm text-content/80">
                <ShieldCheck size={15} className="mr-1.5 inline text-brand" />
                Exact address: <strong className="font-semibold text-content">{meetup.address}</strong>,{' '}
                {meetup.area}, {meetup.city}.
              </p>
            ) : (
              <p className="text-sm text-content/55">
                The exact street address is shared with you once you join.
              </p>
            )}
          </section>

          <HostCard host={meetup.host} />

          <section id="feedback" aria-labelledby="feedback-heading" className="scroll-mt-24 space-y-5">
            <h2 id="feedback-heading" className="display-md text-content">
              How it went
            </h2>
            <VouchSummary vouches={vouches} />
            <VouchList vouches={vouches} />
          </section>
        </div>

        <JoinPanel meetup={meetup} user={user} existingStatus={join?.status ?? null} />
      </div>

      {others.length > 0 && (
        <section aria-labelledby="more-heading" className="mt-16 border-t border-content/10 pt-12">
          <h2 id="more-heading" className="display-md text-content">
            More {category?.name.toLowerCase()} in {meetup.city}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((other) => (
              <MeetupCard key={other.id} meetup={other} saved={savedIds.includes(other.id)} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon size={17} className="mt-0.5 shrink-0 text-brand" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs font-bold uppercase tracking-[0.14em] text-content/45">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-content">{children}</dd>
      </div>
    </div>
  );
}

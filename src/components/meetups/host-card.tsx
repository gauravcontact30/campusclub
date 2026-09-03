import { BadgeCheck } from 'lucide-react';
import type { HostSummary } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { RatingBlocks } from '@/components/ui/rating-blocks';
import { formatDay } from '@/lib/utils';

export function HostCard({ host }: { host: HostSummary }) {
  return (
    <section className="surface-card p-6" aria-labelledby="host-heading">
      <h2 id="host-heading" className="text-xs font-bold uppercase tracking-[0.16em] text-content/50">
        Your host
      </h2>
      <div className="mt-4 flex items-start gap-4">
        <Avatar name={host.name} src={host.avatarUrl} size={52} />
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5 font-display text-lg font-bold text-content">
            {host.name}
            {host.verified && <BadgeCheck size={16} className="text-brand" aria-label="Verified host" />}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-content/60">
            <span className="inline-flex items-center gap-1.5">
              <RatingBlocks value={host.rating} size={11} />
              <span className="font-semibold text-content">{host.rating.toFixed(1)}</span>
            </span>
            <span>{host.hostedCount} meetups hosted</span>
            <span>Member since {formatDay(host.memberSince)}</span>
          </p>
        </div>
      </div>
      {host.bio && <p className="mt-4 text-sm leading-relaxed text-content/75">{host.bio}</p>}
    </section>
  );
}

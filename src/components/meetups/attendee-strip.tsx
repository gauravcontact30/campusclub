import { Avatar } from '@/components/ui/avatar';
import { pluralize } from '@/lib/utils';
import type { JoinStatus } from '@/types';

/**
 * First names only, and no link to anyone's profile — who is coming is useful
 * context for deciding, not a directory to be mined.
 */
export function AttendeeStrip({
  attendees,
  spotsTotal,
}: {
  attendees: { name: string; avatarUrl: string | null; status: JoinStatus }[];
  spotsTotal: number;
}) {
  const going = attendees.filter((a) => a.status === 'confirmed');
  if (!going.length) {
    return (
      <p className="text-sm text-content/60">
        No one has joined yet — {spotsTotal} spots, all open. Somebody has to be first.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex -space-x-2">
        {going.slice(0, 6).map((a, i) => (
          <Avatar
            key={`${a.name}-${i}`}
            name={a.name}
            src={a.avatarUrl}
            size={34}
            className="ring-2 ring-canvas-700"
          />
        ))}
      </div>
      <p className="text-sm text-content/70">
        {going
          .slice(0, 3)
          .map((a) => a.name.split(' ')[0])
          .join(', ')}
        {going.length > 3 && ` and ${pluralize(going.length - 3, 'other')}`} {going.length === 1 ? 'is' : 'are'} going.
      </p>
    </div>
  );
}

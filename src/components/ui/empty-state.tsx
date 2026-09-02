import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pearl/5 text-pearl/55">
        <SearchX size={26} />
      </span>
      <h3 className="display-md text-2xl">{title}</h3>
      <p className="lede max-w-md">{description}</p>
      {action}
    </div>
  );
}

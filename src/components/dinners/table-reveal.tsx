import { Sparkles } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import type { TableMate } from '@/lib/data/dinners';

export function TableReveal({ mates, locked }: { mates: TableMate[]; locked: boolean }) {
  return (
    <section className="rounded-4xl bg-canvas p-7 text-content sm:p-9">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-rouge" />
        <h2 className="font-display text-2xl font-semibold">Your table</h2>
      </div>
      <p className="mt-2 max-w-xl text-sm text-content/65">
        {locked
          ? 'Claim your seat and we will introduce the five people you are eating with — first names only, the rest is for the table.'
          : 'Five people matched on how you talk, what you are curious about and how late you stay. Full names are nobody’s business but yours.'}
      </p>

      <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mates.map((mate, i) => (
          <li
            key={`${mate.name}-${i}`}
            className="flex items-center gap-3 rounded-2xl border border-content/15 bg-content/5 p-4"
          >
            <Avatar name={mate.name} src={locked ? null : mate.avatar} size={44} />
            <div className={locked ? 'blur-[5px] select-none' : ''}>
              <p className="text-sm font-semibold">
                {mate.name}, {mate.ageBand}
              </p>
              <p className="text-xs text-content/60">{mate.works}</p>
              <p className="mt-0.5 text-xs text-rouge">Into {mate.sharedInterest}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

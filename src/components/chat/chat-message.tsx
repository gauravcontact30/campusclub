import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The assistant answers in plain prose with root-relative links, so rendering
 * is deliberately narrow: paragraphs, bullet lines, and in-app links. No
 * markdown parser, and no `dangerouslySetInnerHTML` anywhere near model output.
 */
const LINK = /(\/(?:businesses|dinners|pricing|how-it-works|about|saved|bookings|signup|login)[\w/-]*)/g;

function withLinks(text: string, onNavigate: () => void) {
  return text.split(LINK).map((part, i) =>
    i % 2 === 1 ? (
      <Link
        key={i}
        href={part}
        onClick={onNavigate}
        className="font-medium text-brand underline decoration-brand/40 underline-offset-2 hover:decoration-brand"
      >
        {part}
      </Link>
    ) : (
      part
    ),
  );
}

export function ChatBubble({
  role,
  content,
  onNavigate,
}: {
  role: 'user' | 'assistant';
  content: string;
  onNavigate: () => void;
}) {
  const mine = role === 'user';
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          mine
            ? 'rounded-br-md bg-brand text-on-brand'
            : 'rounded-bl-md border border-content/10 bg-canvas-600 text-content',
        )}
      >
        {content.split('\n').map((line, i) => (
          <p key={i} className={cn(line.startsWith('•') && 'pl-1', i > 0 && 'mt-1.5')}>
            {withLinks(line, onNavigate)}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Three dots while the first token is still in flight. */
export function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-content/10 bg-canvas-600 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-content/50"
            style={{ animationDelay: `${i * 160}ms`, animationDuration: '1s' }}
          />
        ))}
      </div>
    </div>
  );
}

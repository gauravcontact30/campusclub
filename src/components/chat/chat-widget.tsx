'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/i18n/client';
import { useChat } from './use-chat';
import { ChatBubble, TypingDots } from './chat-message';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const { messages, pending, mode, send, reset } = useChat();
  const { t } = useLocale();
  const openers = [t.chat.opener1, t.chat.opener2, t.chat.opener3, t.chat.opener4];

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCount = useRef(0);

  // Follow the transcript as it grows. Reading refs in an effect keyed on the
  // message count keeps this out of render and away from setState-in-effect.
  useEffect(() => {
    if (messages.length === lastCount.current) return;
    lastCount.current = messages.length;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  });

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const ask = (text: string) => {
    setDraft('');
    void send(text);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? t.chat.close : t.chat.open}
        className={cn(
          'fixed bottom-5 right-5 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full',
          'bg-brand text-on-brand shadow-lift transition-transform duration-200 hover:scale-105 active:scale-95',
          'sm:bottom-7 sm:right-7',
        )}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t.chat.title}
          className={cn(
            'fixed inset-x-3 bottom-24 z-[60] flex max-h-[min(34rem,calc(100dvh-8rem))] flex-col overflow-hidden',
            'animate-fade-up rounded-3xl border border-content/12 bg-canvas-700 shadow-lift',
            'sm:inset-x-auto sm:right-7 sm:w-[26rem]',
          )}
        >
          <header className="flex items-center gap-3 border-b border-content/10 px-4 py-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-brand">
              <Sparkles size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-content">{t.chat.title}</p>
              <p className="truncate text-xs text-content/55">
                {mode === 'demo' ? t.chat.subtitleDemo : t.chat.subtitleLive}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                aria-label={t.chat.reset}
                className="rounded-full p-2 text-content/55 transition-colors hover:bg-content/10 hover:text-content"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-content/70">
                  {t.chat.intro}
                </p>
                <div className="flex flex-wrap gap-2">
                  {openers.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => ask(o)}
                      className="rounded-full border border-content/15 px-3 py-1.5 text-xs text-content/75 transition-colors hover:border-brand hover:text-content"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) =>
                m.role === 'assistant' && !m.content ? (
                  <TypingDots key={m.id} />
                ) : (
                  <ChatBubble key={m.id} role={m.role} content={m.content} onNavigate={() => setOpen(false)} />
                ),
              )
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
            className="flex items-center gap-2 border-t border-content/10 p-3"
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.chat.placeholder}
              aria-label={t.chat.inputLabel}
              maxLength={4000}
              className="min-w-0 flex-1 rounded-full border border-content/15 bg-canvas px-4 py-2.5 text-sm text-content placeholder:text-content/45 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/35"
            />
            <button
              type="submit"
              disabled={pending || !draft.trim()}
              aria-label={t.chat.send}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand transition-opacity disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

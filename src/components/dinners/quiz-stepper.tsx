'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { QUIZ_QUESTIONS } from '@/lib/constants';
import { useQuizStore } from '@/store/quiz-store';
import { saveQuizAction } from '@/app/actions/dinners';
import { useUiStore } from '@/store/ui-store';
import { Button, ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function QuizStepper({ signedIn, initialAnswers }: { signedIn: boolean; initialAnswers: Record<string, string> }) {
  const { step, answers, answer, next, back, goTo, reset } = useQuizStore();
  const [merged] = useState(() => ({ ...initialAnswers }));
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const pushToast = useUiStore((s) => s.pushToast);
  const router = useRouter();

  const total = QUIZ_QUESTIONS.length;
  const index = Math.min(step, total - 1);
  const question = QUIZ_QUESTIONS[index];
  const current = answers[question.id] ?? merged[question.id];
  const progress = Math.round(((index + (current ? 1 : 0)) / total) * 100);

  function choose(value: string) {
    answer(question.id, value);
    if (index < total - 1) {
      setTimeout(next, 180);
    }
  }

  function finish() {
    const payload = { ...merged, ...answers };
    startTransition(async () => {
      const result = await saveQuizAction(payload);
      if (!result.ok) {
        pushToast({ title: result.message ?? 'Could not save', tone: 'error' });
        return;
      }
      pushToast({ title: result.message ?? 'Saved', tone: 'success' });
      setDone(true);
      reset();
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className="surface-card p-8 text-center sm:p-12">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-signal/25 text-content">
          <Check size={30} />
        </span>
        <h2 className="display-md mt-6">You are match-ready.</h2>
        <p className="lede mx-auto mt-3 max-w-md">
          We have what we need to seat you well. Pick a Wednesday and we will do the rest.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/dinners" size="lg">
            Choose a dinner
          </ButtonLink>
          <ButtonLink href="/profile" variant="outline" size="lg">
            See my profile
          </ButtonLink>
        </div>
      </div>
    );
  }

  const answeredAll = QUIZ_QUESTIONS.every((q) => (answers[q.id] ?? merged[q.id]));

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-content/60">
        <span>
          Question {index + 1} of {total}
        </span>
        <span>{progress}% complete</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-content/10">
        <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div key={question.id} className="mt-9 animate-fade-up">
        <h2 className="display-md">{question.prompt}</h2>
        <p className="mt-2 text-sm text-content/60">{question.help}</p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => {
            const active = current === option.value;
            return (
              <button
                key={option.value}
                onClick={() => choose(option.value)}
                aria-pressed={active}
                className={cn(
                  'group rounded-3xl border p-5 text-left transition-all hover:-translate-y-0.5',
                  active ? 'border-brand bg-brand text-content' : 'border-content/15 bg-canvas-700 hover:border-content/40',
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display text-lg font-semibold">{option.label}</span>
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                      active ? 'border-brand bg-brand text-content' : 'border-content/25',
                    )}
                  >
                    {active && <Check size={14} />}
                  </span>
                </span>
                {'hint' in option && option.hint && (
                  <span className={cn('mt-1.5 block text-sm', active ? 'text-content/60' : 'text-content/60')}>
                    {option.hint}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-9 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} disabled={index === 0}>
          <ArrowLeft size={16} /> Back
        </Button>

        {index < total - 1 ? (
          <Button variant="outline" onClick={next} disabled={!current}>
            Next <ArrowRight size={16} />
          </Button>
        ) : signedIn ? (
          <Button size="lg" onClick={finish} disabled={!answeredAll || pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : 'Save my matching profile'}
          </Button>
        ) : (
          <Link
            href="/signup?next=/dinners/quiz"
            className="inline-flex h-14 items-center rounded-full bg-brand px-8 font-semibold text-content hover:bg-brand-600"
          >
            Create an account to save
          </Link>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-1.5">
        {QUIZ_QUESTIONS.map((q, i) => (
          <button
            key={q.id}
            onClick={() => goTo(i)}
            aria-label={`Go to question ${i + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === index ? 'w-8 bg-content' : (answers[q.id] ?? merged[q.id]) ? 'w-4 bg-brand' : 'w-4 bg-content/15',
            )}
          />
        ))}
      </div>
    </div>
  );
}

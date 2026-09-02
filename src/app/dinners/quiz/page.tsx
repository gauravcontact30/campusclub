import type { Metadata } from 'next';
import { QuizStepper } from '@/components/dinners/quiz-stepper';
import { getCurrentUser } from '@/lib/auth/session';
import { getQuiz } from '@/lib/data/dinners';

export const metadata: Metadata = {
  title: 'Matching questionnaire',
  description: 'Six questions, two minutes. They decide who you sit with.',
};

export default async function QuizPage() {
  const user = await getCurrentUser();
  const answers = user ? await getQuiz(user.id) : null;

  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <p className="eyebrow">Matching questionnaire</p>
      <h1 className="display-lg mt-3">Six questions. Two minutes. One good table.</h1>
      <p className="lede mt-4">
        Nobody sees your answers — they only decide who is sitting next to you. You can retake this whenever your mood
        changes.
      </p>

      <div className="mt-12">
        <QuizStepper signedIn={Boolean(user)} initialAnswers={answers ?? {}} />
      </div>
    </div>
  );
}

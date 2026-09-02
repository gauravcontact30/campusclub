'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuizAnswers } from '@/types';

interface QuizState {
  step: number;
  answers: QuizAnswers;
  answer: (questionId: string, value: string) => void;
  next: () => void;
  back: () => void;
  goTo: (step: number) => void;
  reset: () => void;
}

/**
 * Persisted so a half-finished matching questionnaire survives a refresh —
 * the flow is six screens long and losing it is the fastest way to lose a signup.
 */
export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      step: 0,
      answers: {},
      answer: (questionId, value) => set((s) => ({ answers: { ...s.answers, [questionId]: value } })),
      next: () => set((s) => ({ step: s.step + 1 })),
      back: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
      goTo: (step) => set({ step }),
      reset: () => set({ step: 0, answers: {} }),
    }),
    { name: 'sitnext-quiz' },
  ),
);

'use client';

import { create } from 'zustand';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'error' | 'info';
}

interface UiState {
  mobileNavOpen: boolean;
  toasts: Toast[];
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  toasts: [],
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  pushToast: (toast) =>
    set((s) => ({ toasts: [...s.toasts, { ...toast, id: Math.random().toString(36).slice(2) }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

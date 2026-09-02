'use client';

import { create } from 'zustand';
import type { BusinessQuery, PriceLevel } from '@/types';

interface FiltersState extends BusinessQuery {
  setFilter: <K extends keyof BusinessQuery>(key: K, value: BusinessQuery[K]) => void;
  togglePrice: (level: PriceLevel) => void;
  hydrate: (query: BusinessQuery) => void;
  reset: () => void;
}

const initial: BusinessQuery = {
  term: '',
  city: '',
  category: '',
  price: [],
  minRating: 0,
  openNow: false,
  sort: 'recommended',
  page: 1,
};

export const useFiltersStore = create<FiltersState>((set) => ({
  ...initial,
  setFilter: (key, value) =>
    set((s) => ({ ...s, [key]: value, page: key === 'page' ? (value as number) : 1 })),
  togglePrice: (level) =>
    set((s) => {
      const current = s.price ?? [];
      return {
        price: current.includes(level) ? current.filter((p) => p !== level) : [...current, level],
        page: 1,
      };
    }),
  hydrate: (query) => set((s) => ({ ...s, ...query })),
  reset: () => set({ ...initial }),
}));

import { create } from 'zustand';
import type { Track } from '@/lib/types';

interface SearchState {
  query: string;
  results: Track[];
  loading: boolean;
  error: string | null;
  isOpen: boolean;
}

interface SearchActions {
  setQuery: (query: string) => void;
  setResults: (results: Track[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
}

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
  query: '',
  results: [],
  loading: false,
  error: null,
  isOpen: true,

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
}));

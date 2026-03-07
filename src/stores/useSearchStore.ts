import { create } from 'zustand';
import type { Track } from '@/lib/types';

interface SearchState {
  query: string;
  results: Track[];
  loading: boolean;
  loadingMeta: boolean;
  error: string | null;
  isOpen: boolean;
  qualityFilter: 'all' | 'hd' | 'sd';
}

interface SearchActions {
  setQuery: (query: string) => void;
  setResults: (results: Track[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMeta: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setQualityFilter: (filter: 'all' | 'hd' | 'sd') => void;
  updateTrackMeta: (videoId: string, meta: Partial<Pick<Track, 'bpm' | 'definition'>>) => void;
}

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
  query: '',
  results: [],
  loading: false,
  loadingMeta: false,
  error: null,
  isOpen: true,
  qualityFilter: 'all',

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setLoadingMeta: (loading) => set({ loadingMeta: loading }),
  setError: (error) => set({ error, loading: false }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  setQualityFilter: (filter) => set({ qualityFilter: filter }),
  updateTrackMeta: (videoId, meta) => set((s) => ({
    results: s.results.map((t) =>
      t.videoId === videoId ? { ...t, ...meta } : t
    ),
  })),
}));

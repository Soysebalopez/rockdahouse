'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchStore } from '@/stores/useSearchStore';
import { searchYouTube, getSearchesRemaining } from '@/lib/youtube';
import SearchResult from './SearchResult';
import type { DeckId } from '@/lib/types';

interface SearchPanelProps {
  onLoadToDeck: (videoId: string, title: string, channel: string, thumbnail: string, deckId: DeckId) => void;
}

export default function SearchPanel({ onLoadToDeck }: SearchPanelProps) {
  const { query, results, loading, error, isOpen, setQuery, setResults, setLoading, setError } = useSearchStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const [remaining, setRemaining] = useState(100);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const tracks = await searchYouTube(q);
      setResults(tracks);
      setRemaining(getSearchesRemaining());
    } catch (err: any) {
      setError(err.message);
    }
  }, [setResults, setLoading, setError]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  useEffect(() => {
    setRemaining(getSearchesRemaining());
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="w-full rounded-xl p-3 flex flex-col h-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="Search YouTube for tracks..."
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
        }}
        data-search-input
        disabled={remaining <= 0}
      />
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-[9px]" style={{ color: remaining <= 10 ? 'var(--vu-red)' : 'var(--text-muted)' }}>
          {remaining > 0 ? `${remaining} searches left today` : 'Daily limit reached — resets at midnight'}
        </span>
      </div>
      <div className="mt-1 overflow-y-auto flex-1">
        {loading && (
          <div className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>Searching...</div>
        )}
        {error && (
          <div className="text-sm py-4 text-center" style={{ color: 'var(--vu-red)' }}>{error}</div>
        )}
        {!loading && !error && results.length === 0 && query && (
          <div className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>No results found</div>
        )}
        {!loading && !error && results.length === 0 && !query && (
          <div className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>Search for a song to get started</div>
        )}
        {results.map((track) => (
          <SearchResult key={track.videoId} track={track} onLoadToDeck={onLoadToDeck} />
        ))}
      </div>
    </div>
  );
}

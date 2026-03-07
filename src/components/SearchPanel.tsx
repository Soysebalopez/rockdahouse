'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchStore } from '@/stores/useSearchStore';
import { searchYouTube, getSearchesRemaining } from '@/lib/youtube';
import SearchResult from './SearchResult';
import type { DeckId } from '@/lib/types';

interface SearchPanelProps {
  onLoadToDeck: (videoId: string, title: string, channel: string, thumbnail: string, deckId: DeckId) => void;
}

const QUALITY_FILTERS = [
  { value: 'all' as const, label: 'ALL' },
  { value: 'hd' as const, label: 'HD' },
  { value: 'sd' as const, label: 'SD' },
];

export default function SearchPanel({ onLoadToDeck }: SearchPanelProps) {
  const {
    query, results, loading, loadingMeta, error, isOpen, qualityFilter,
    setQuery, setResults, setLoading, setLoadingMeta, setError,
    setQualityFilter, updateTrackMeta,
  } = useSearchStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const [remaining, setRemaining] = useState(100);

  // Fetch metadata (BPM + quality) for search results
  const fetchMetadata = useCallback(async (tracks: { videoId: string; title: string }[]) => {
    if (tracks.length === 0) return;
    setLoadingMeta(true);

    try {
      const [videoDetailsRes, bpmBatchRes] = await Promise.allSettled([
        fetch('/api/video-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoIds: tracks.map((t) => t.videoId) }),
        }).then((r) => r.json()),
        fetch('/api/bpm-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titles: tracks.map((t) => t.title) }),
        }).then((r) => r.json()),
      ]);

      if (videoDetailsRes.status === 'fulfilled' && videoDetailsRes.value.results) {
        const details = videoDetailsRes.value.results;
        for (const track of tracks) {
          if (details[track.videoId]) {
            updateTrackMeta(track.videoId, { definition: details[track.videoId].definition });
          }
        }
      }

      if (bpmBatchRes.status === 'fulfilled' && bpmBatchRes.value.results) {
        const bpmData = bpmBatchRes.value.results;
        for (const track of tracks) {
          if (bpmData[track.title] !== undefined) {
            updateTrackMeta(track.videoId, { bpm: bpmData[track.title].bpm });
          }
        }
      }
    } catch (err) {
      console.warn('[SearchPanel] metadata fetch failed:', err);
    } finally {
      setLoadingMeta(false);
    }
  }, [setLoadingMeta, updateTrackMeta]);

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
      fetchMetadata(tracks);
    } catch (err: any) {
      setError(err.message);
    }
  }, [setResults, setLoading, setError, fetchMetadata]);

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

  const filteredResults = qualityFilter === 'all'
    ? results
    : results.filter((t) => t.definition === qualityFilter);

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
          {remaining > 0 ? `${remaining} searches left today` : 'Daily limit reached \u2014 resets at midnight'}
        </span>
        {loadingMeta && (
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Loading metadata...</span>
        )}
      </div>

      {/* Quality filter */}
      {results.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 px-1">
          {QUALITY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setQualityFilter(f.value)}
              className="px-2 py-0.5 rounded text-[10px] font-bold transition-colors"
              style={{
                background: qualityFilter === f.value ? 'var(--accent-a)' : 'var(--bg-elevated)',
                color: qualityFilter === f.value ? '#fff' : 'var(--text-muted)',
              }}
            >
              {f.label}
            </button>
          ))}
          {qualityFilter !== 'all' && (
            <span className="text-[9px] ml-1" style={{ color: 'var(--text-muted)' }}>
              {filteredResults.length} of {results.length}
            </span>
          )}
        </div>
      )}

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
        {!loading && !error && filteredResults.length === 0 && results.length > 0 && qualityFilter !== 'all' && (
          <div className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
            No {qualityFilter.toUpperCase()} results. Try &quot;ALL&quot; filter.
          </div>
        )}
        {filteredResults.map((track) => (
          <SearchResult key={track.videoId} track={track} onLoadToDeck={onLoadToDeck} />
        ))}
      </div>
    </div>
  );
}

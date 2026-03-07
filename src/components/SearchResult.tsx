'use client';

import type { Track, DeckId } from '@/lib/types';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { useMixerStore } from '@/stores/useMixerStore';
import { useSearchStore } from '@/stores/useSearchStore';

interface SearchResultProps {
  track: Track;
  onLoadToDeck: (videoId: string, title: string, channel: string, thumbnail: string, deckId: DeckId) => void;
}

const DECK_BUTTONS: { id: DeckId; bg: string }[] = [
  { id: 'A', bg: 'var(--accent-a-dim)' },
  { id: 'B', bg: 'var(--accent-b-dim)' },
  { id: 'C', bg: 'var(--accent-c-dim)' },
  { id: 'D', bg: 'var(--accent-d-dim)' },
];

export default function SearchResult({ track, onLoadToDeck }: SearchResultProps) {
  const addTrack = usePlaylistStore((s) => s.addTrack);
  const deckMode = useMixerStore((s) => s.deckMode);
  const loadingMeta = useSearchStore((s) => s.loadingMeta);

  const visibleDecks = deckMode === 4 ? DECK_BUTTONS : DECK_BUTTONS.slice(0, 2);

  // Determine badge states
  const bpmLoading = loadingMeta && track.bpm === undefined;
  const qualityLoading = loadingMeta && track.definition === undefined;

  return (
    <div
      className="flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors"
      style={{ cursor: 'default' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <img
        src={track.thumbnail}
        alt=""
        className="rounded"
        style={{ width: 60, height: 45, objectFit: 'cover' }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{track.title}</div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{track.channel}</span>
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>&middot;</span>
          {/* BPM badge */}
          {bpmLoading ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: 'rgba(156, 163, 175, 0.15)', color: 'var(--text-muted)' }}>
              ... BPM
            </span>
          ) : track.bpm ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent-a)' }}>
              {track.bpm} BPM
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: 'var(--text-muted)' }}>
              N/A
            </span>
          )}
          {/* Quality badge */}
          {qualityLoading ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: 'rgba(156, 163, 175, 0.15)', color: 'var(--text-muted)' }}>
              ...
            </span>
          ) : track.definition ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: track.definition === 'hd' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)', color: track.definition === 'hd' ? '#22c55e' : 'var(--text-muted)' }}>
              {track.definition.toUpperCase()}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => addTrack(track)}
          className="px-2 py-1 rounded text-xs font-bold transition-colors"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          title="Add to playlist"
        >
          +
        </button>
        {visibleDecks.map(({ id, bg }) => (
          <button
            key={id}
            onClick={() => onLoadToDeck(track.videoId, track.title, track.channel, track.thumbnail, id)}
            className="px-2 py-1 rounded text-xs font-bold transition-colors"
            style={{ background: bg, color: '#fff' }}
          >
            &rarr; {id}
          </button>
        ))}
      </div>
    </div>
  );
}

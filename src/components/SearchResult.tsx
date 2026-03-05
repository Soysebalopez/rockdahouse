'use client';

import type { Track, DeckId } from '@/lib/types';
import { usePlaylistStore } from '@/stores/usePlaylistStore';

interface SearchResultProps {
  track: Track;
  onLoadToDeck: (videoId: string, title: string, channel: string, thumbnail: string, deckId: DeckId) => void;
}

export default function SearchResult({ track, onLoadToDeck }: SearchResultProps) {
  const addTrack = usePlaylistStore((s) => s.addTrack);

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
        <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{track.channel}</div>
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
        <button
          onClick={() => onLoadToDeck(track.videoId, track.title, track.channel, track.thumbnail, 'A')}
          className="px-2 py-1 rounded text-xs font-bold transition-colors"
          style={{ background: 'var(--accent-a-dim)', color: '#fff' }}
        >
          → A
        </button>
        <button
          onClick={() => onLoadToDeck(track.videoId, track.title, track.channel, track.thumbnail, 'B')}
          className="px-2 py-1 rounded text-xs font-bold transition-colors"
          style={{ background: 'var(--accent-b-dim)', color: '#fff' }}
        >
          → B
        </button>
      </div>
    </div>
  );
}

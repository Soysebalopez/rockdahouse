'use client';

import { useCallback, useRef } from 'react';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import type { DeckId, Track } from '@/lib/types';

interface PlaylistProps {
  onLoadToDeck: (videoId: string, title: string, channel: string, thumbnail: string, deckId: DeckId) => void;
}

export default function Playlist({ onLoadToDeck }: PlaylistProps) {
  const { tracks, isOpen, removeTrack, moveTrack, clearPlaylist } = usePlaylistStore();
  const dragIndexRef = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;
    moveTrack(dragIndexRef.current, index);
    dragIndexRef.current = index;
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
  };

  if (!isOpen || tracks.length === 0) return null;

  return (
    <div className="w-full rounded-xl p-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Playlist ({tracks.length})
        </span>
        <button
          onClick={clearPlaylist}
          className="text-[10px] px-2 py-0.5 rounded"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
        >
          Clear
        </button>
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 160 }}>
        {tracks.map((track, i) => (
          <div
            key={track.videoId}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-2 px-2 py-1 rounded cursor-grab active:cursor-grabbing transition-colors"
            style={{ background: 'var(--bg-elevated)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
          >
            <span className="text-[10px] w-4 text-center tabular-nums" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
            <img src={track.thumbnail} alt="" className="rounded" style={{ width: 40, height: 30, objectFit: 'cover' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{track.title}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => onLoadToDeck(track.videoId, track.title, track.channel, track.thumbnail, 'A')}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                style={{ background: 'var(--accent-a-dim)', color: '#fff' }}
              >A</button>
              <button
                onClick={() => onLoadToDeck(track.videoId, track.title, track.channel, track.thumbnail, 'B')}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                style={{ background: 'var(--accent-b-dim)', color: '#fff' }}
              >B</button>
              <button
                onClick={() => removeTrack(track.videoId)}
                className="px-1.5 py-0.5 rounded text-[9px]"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
              >✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

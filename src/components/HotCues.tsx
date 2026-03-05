'use client';

import { useCallback } from 'react';
import type { HotCue } from '@/stores/useDeckStore';

const CUE_COLORS = ['#ef4444', '#eab308', '#22c55e'];

interface HotCuesProps {
  hotCues: (HotCue | null)[];
  currentTime: number;
  onSetHotCue: (index: number, cue: HotCue | null) => void;
  onSeek: (time: number) => void;
}

export default function HotCues({ hotCues, currentTime, onSetHotCue, onSeek }: HotCuesProps) {
  const handleClick = useCallback((index: number) => {
    const existing = hotCues[index];
    if (existing) {
      // Jump to cue point
      onSeek(existing.time);
    } else {
      // Set new cue at current position
      onSetHotCue(index, {
        time: currentTime,
        label: `${index + 1}`,
        color: CUE_COLORS[index],
      });
    }
  }, [hotCues, currentTime, onSetHotCue, onSeek]);

  const handleClear = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    onSetHotCue(index, null);
  }, [onSetHotCue]);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold tracking-wider uppercase mr-1" style={{ color: 'var(--text-muted)' }}>CUE</span>
      {[0, 1, 2].map((i) => {
        const cue = hotCues[i];
        const color = CUE_COLORS[i];
        return (
          <button
            key={i}
            onClick={() => handleClick(i)}
            onContextMenu={(e) => handleClear(e, i)}
            className="relative w-8 h-8 rounded-lg text-xs font-bold transition-all"
            style={{
              background: cue ? color : 'var(--bg-elevated)',
              color: cue ? '#fff' : 'var(--text-muted)',
              boxShadow: cue ? `0 0 8px ${color}` : 'none',
            }}
            title={cue ? `Jump to ${formatTime(cue.time)} (right-click to clear)` : `Set cue ${i + 1}`}
          >
            {cue ? cue.label : `${i + 1}`}
            {cue && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {formatTime(cue.time)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

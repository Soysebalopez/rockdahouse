'use client';

import Fader from './Fader';
import type { DeckId } from '@/lib/types';
import { getDeckStoreById } from '@/stores/useDeckStore';

interface PitchFaderProps {
  deckId: DeckId;
  accentColor: string;
}

export default function PitchFader({ deckId, accentColor }: PitchFaderProps) {
  const store = getDeckStoreById(deckId);
  const pitchValue = store((s) => s.pitchValue);
  const pitchRange = store((s) => s.pitchRange);
  const setPitchValue = store((s) => s.setPitchValue);
  const setPitchRange = store((s) => s.setPitchRange);

  const displayPercent = pitchValue * pitchRange;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-0.5">
        <button
          onClick={() => setPitchRange(8)}
          className="px-1 py-0.5 rounded text-[8px] font-bold"
          style={{
            background: pitchRange === 8 ? accentColor : 'var(--bg-elevated)',
            color: pitchRange === 8 ? '#fff' : 'var(--text-muted)',
          }}
        >
          ±8
        </button>
        <button
          onClick={() => setPitchRange(16)}
          className="px-1 py-0.5 rounded text-[8px] font-bold"
          style={{
            background: pitchRange === 16 ? accentColor : 'var(--bg-elevated)',
            color: pitchRange === 16 ? '#fff' : 'var(--text-muted)',
          }}
        >
          ±16
        </button>
      </div>
      <Fader
        value={pitchValue}
        onChange={setPitchValue}
        min={-1}
        max={1}
        step={0.005}
        height={80}
        accentColor={accentColor}
        showCenter
      />
      <button
        onDoubleClick={() => setPitchValue(0)}
        className="text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded"
        style={{
          color: Math.abs(pitchValue) < 0.005 ? 'var(--text-muted)' : accentColor,
          background: 'var(--bg-elevated)',
        }}
        title="Double-click to reset"
      >
        {displayPercent >= 0 ? '+' : ''}{displayPercent.toFixed(1)}%
      </button>
    </div>
  );
}

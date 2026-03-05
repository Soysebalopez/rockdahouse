'use client';

import { useTapTempo } from '@/hooks/useTapTempo';
import { useEffect } from 'react';

interface BPMDisplayProps {
  onBpmChange?: (bpm: number | null) => void;
  accentColor: string;
}

export default function BPMDisplay({ onBpmChange, accentColor }: BPMDisplayProps) {
  const { bpm, tap } = useTapTempo();

  useEffect(() => {
    onBpmChange?.(bpm);
  }, [bpm, onBpmChange]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>BPM</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)', minWidth: 60, textAlign: 'center' }}>
        {bpm ?? '---'}
      </div>
      <button
        onClick={tap}
        className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors"
        style={{ background: accentColor, color: '#fff' }}
      >
        TAP
      </button>
    </div>
  );
}

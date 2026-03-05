'use client';

import { useTapTempo } from '@/hooks/useTapTempo';
import { useEffect, useState, useCallback } from 'react';

interface BPMDisplayProps {
  trackTitle: string;
  onBpmChange?: (bpm: number | null) => void;
  accentColor: string;
}

export default function BPMDisplay({ trackTitle, onBpmChange, accentColor }: BPMDisplayProps) {
  const { bpm: tapBpm, tap } = useTapTempo();
  const [apiBpm, setApiBpm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'tap' | 'spotify' | null>(null);

  // Fetch BPM from Spotify when track changes
  useEffect(() => {
    if (!trackTitle) {
      setApiBpm(null);
      setSource(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/bpm?title=${encodeURIComponent(trackTitle)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.bpm) {
          setApiBpm(data.bpm);
          setSource('spotify');
        } else {
          setApiBpm(null);
          setSource(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiBpm(null);
          setSource(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [trackTitle]);

  // Tap BPM overrides API BPM
  const displayBpm = tapBpm ?? apiBpm;

  useEffect(() => {
    onBpmChange?.(displayBpm);
  }, [displayBpm, onBpmChange]);

  const handleTap = useCallback(() => {
    tap();
    setSource('tap');
  }, [tap]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>BPM</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)', minWidth: 60, textAlign: 'center' }}>
        {loading ? '...' : (displayBpm ?? '---')}
      </div>
      {source && (
        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {source === 'spotify' ? '♫ spotify' : '⏱ tap'}
        </div>
      )}
      <button
        onClick={handleTap}
        className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors"
        style={{ background: accentColor, color: '#fff' }}
      >
        TAP
      </button>
    </div>
  );
}

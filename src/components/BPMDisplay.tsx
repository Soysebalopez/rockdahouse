'use client';

import { useTapTempo } from '@/hooks/useTapTempo';
import { useEffect, useState, useCallback, useRef } from 'react';

interface BPMDisplayProps {
  trackTitle: string;
  onBpmChange?: (bpm: number | null) => void;
  accentColor: string;
  playbackRate?: number;
}

export default function BPMDisplay({ trackTitle, onBpmChange, accentColor, playbackRate = 1 }: BPMDisplayProps) {
  const { bpm: tapBpm, tap, reset: resetTap, tapCount } = useTapTempo();
  const [apiBpm, setApiBpm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'tap' | 'spotify' | null>(null);
  const [tapFlash, setTapFlash] = useState(false);
  const flashTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

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
  const effectiveBpm = displayBpm && playbackRate !== 1 ? Math.round(displayBpm * playbackRate) : null;

  useEffect(() => {
    onBpmChange?.(displayBpm);
  }, [displayBpm, onBpmChange]);

  const handleTap = useCallback(() => {
    tap();
    setSource('tap');
    // Flash animation
    setTapFlash(true);
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setTapFlash(false), 150);
  }, [tap]);

  const handleReset = useCallback(() => {
    resetTap();
    if (apiBpm) {
      setSource('spotify');
    } else {
      setSource(null);
    }
  }, [resetTap, apiBpm]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>BPM</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)', minWidth: 60, textAlign: 'center' }}>
        {loading ? '...' : (displayBpm ?? '---')}
      </div>
      {effectiveBpm && (
        <div className="text-[10px] font-mono tabular-nums" style={{ color: accentColor }}>
          {'\u2192'} {effectiveBpm}
        </div>
      )}
      {source && (
        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {source === 'spotify' ? '\u266B spotify' : `\u23F1 tap (${tapCount})`}
        </div>
      )}
      {!source && !loading && !displayBpm && trackTitle && (
        <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>tap to set BPM</div>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={handleTap}
          className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
          style={{
            background: accentColor,
            color: '#fff',
            transform: tapFlash ? 'scale(1.1)' : 'scale(1)',
            boxShadow: tapFlash ? `0 0 12px ${accentColor}` : 'none',
            transition: 'transform 100ms ease, box-shadow 100ms ease',
          }}
        >
          TAP{tapCount > 0 ? ` (${tapCount})` : ''}
        </button>
        {tapBpm && (
          <button
            onClick={handleReset}
            className="px-1.5 py-1 rounded text-[10px] font-bold"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            title="Clear tap BPM"
          >
            {'\u2715'}
          </button>
        )}
      </div>
      {tapCount === 1 && (
        <div className="text-[9px] animate-pulse" style={{ color: 'var(--text-muted)' }}>tap again...</div>
      )}
    </div>
  );
}

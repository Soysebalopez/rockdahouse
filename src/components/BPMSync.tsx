'use client';

import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';

const SUPPORTED_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function snapToRate(rate: number): number {
  let closest = SUPPORTED_RATES[0];
  let minDiff = Math.abs(rate - closest);
  for (const r of SUPPORTED_RATES) {
    const diff = Math.abs(rate - r);
    if (diff < minDiff) { minDiff = diff; closest = r; }
  }
  return closest;
}

function stepRate(current: number, direction: number): number {
  const idx = SUPPORTED_RATES.indexOf(current);
  if (idx === -1) return snapToRate(current);
  const newIdx = Math.max(0, Math.min(SUPPORTED_RATES.length - 1, idx + direction));
  return SUPPORTED_RATES[newIdx];
}

export default function BPMSync() {
  const bpmA = useDeckAStore((s) => s.bpm);
  const bpmB = useDeckBStore((s) => s.bpm);
  const videoIdA = useDeckAStore((s) => s.videoId);
  const videoIdB = useDeckBStore((s) => s.videoId);
  const rateA = useDeckAStore((s) => s.playbackRate);
  const rateB = useDeckBStore((s) => s.playbackRate);
  const syncLockedA = useDeckAStore((s) => s.syncLocked);
  const syncLockedB = useDeckBStore((s) => s.syncLocked);
  const setPlaybackRateA = useDeckAStore((s) => s.setPlaybackRate);
  const setPlaybackRateB = useDeckBStore((s) => s.setPlaybackRate);
  const setSyncLockedA = useDeckAStore((s) => s.setSyncLocked);
  const setSyncLockedB = useDeckBStore((s) => s.setSyncLocked);

  const effectiveBpmA = bpmA ? Math.round(bpmA * rateA) : null;
  const effectiveBpmB = bpmB ? Math.round(bpmB * rateB) : null;
  const diff = effectiveBpmA && effectiveBpmB ? Math.abs(effectiveBpmA - effectiveBpmB) : null;
  const canSync = !!(bpmA && bpmB);

  // Contextual help message
  let helpMessage = '';
  if (!videoIdA && !videoIdB) {
    helpMessage = 'Load tracks to both decks';
  } else if (!videoIdA || !videoIdB) {
    helpMessage = `Load a track to Deck ${!videoIdA ? 'A' : 'B'}`;
  } else if (!bpmA && !bpmB) {
    helpMessage = 'TAP BPM on both decks';
  } else if (!bpmA) {
    helpMessage = 'TAP BPM on Deck A';
  } else if (!bpmB) {
    helpMessage = 'TAP BPM on Deck B';
  }

  const syncBtoA = () => {
    if (!canSync) return;
    setPlaybackRateB(snapToRate(bpmA! / bpmB!));
  };

  const syncAtoB = () => {
    if (!canSync) return;
    setPlaybackRateA(snapToRate(bpmB! / bpmA!));
  };

  const nudge = (deck: 'A' | 'B', direction: number) => {
    const currentRate = deck === 'A' ? rateA : rateB;
    const setRate = deck === 'A' ? setPlaybackRateA : setPlaybackRateB;
    setRate(stepRate(currentRate, direction));
  };

  const resetRate = (deck: 'A' | 'B') => {
    if (deck === 'A') {
      setPlaybackRateA(1);
      setSyncLockedA(false);
    } else {
      setPlaybackRateB(1);
      setSyncLockedB(false);
    }
  };

  const toggleSyncLock = (deck: 'A' | 'B') => {
    if (!canSync) return;
    if (deck === 'A') {
      const newLocked = !syncLockedA;
      setSyncLockedA(newLocked);
      if (newLocked) setPlaybackRateA(snapToRate(bpmB! / bpmA!));
    } else {
      const newLocked = !syncLockedB;
      setSyncLockedB(newLocked);
      if (newLocked) setPlaybackRateB(snapToRate(bpmA! / bpmB!));
    }
  };

  const rateLabel = (rate: number) => {
    if (rate === 1) return '1x';
    return `${rate > 1 ? '+' : ''}${((rate - 1) * 100).toFixed(0)}%`;
  };

  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      {/* Deck A controls */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1">
          <button onClick={() => nudge('A', -1)} disabled={syncLockedA} className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-a)' }}>-</button>
          <button onClick={() => resetRate('A')} className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--bg-elevated)', color: rateA === 1 ? 'var(--text-muted)' : 'var(--accent-a)' }}>{rateLabel(rateA)}</button>
          <button onClick={() => nudge('A', 1)} disabled={syncLockedA} className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-a)' }}>+</button>
        </div>
        {effectiveBpmA ? (
          <div className="text-[10px] font-mono font-bold tabular-nums" style={{ color: 'var(--accent-a)' }}>{effectiveBpmA} BPM</div>
        ) : (
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{videoIdA ? 'no BPM' : '---'}</div>
        )}
        <button onClick={() => toggleSyncLock('A')} disabled={!canSync} className="px-3 py-1 rounded text-[10px] font-bold uppercase transition-all disabled:opacity-30" style={{ background: syncLockedA ? 'var(--accent-a)' : 'var(--bg-elevated)', color: syncLockedA ? '#fff' : 'var(--text-muted)', boxShadow: syncLockedA ? '0 0 8px var(--accent-a)' : 'none' }}>
          {syncLockedA ? 'LOCKED' : 'LOCK'}
        </button>
      </div>

      {/* Center: BPM diff + sync buttons */}
      <div className="flex flex-col items-center gap-1.5 px-3">
        {diff !== null ? (
          <div className="text-xs font-bold tabular-nums" style={{ color: diff <= 2 ? 'var(--vu-green)' : diff <= 5 ? 'var(--vu-yellow)' : 'var(--vu-red)' }}>
            {diff === 0 ? 'MATCHED' : `\u0394 ${diff} BPM`}
          </div>
        ) : (
          <div className="text-[10px] text-center" style={{ color: 'var(--text-muted)', maxWidth: 120 }}>{helpMessage}</div>
        )}
        <div className="flex gap-1.5">
          <button onClick={syncBtoA} disabled={!canSync} className="px-3 py-1.5 rounded text-xs font-bold uppercase disabled:opacity-30 transition-all" style={{ background: 'var(--accent-a)', color: '#fff' }} title="Sync B to match A's BPM">
            {'\u2190'} SYNC
          </button>
          <button onClick={syncAtoB} disabled={!canSync} className="px-3 py-1.5 rounded text-xs font-bold uppercase disabled:opacity-30 transition-all" style={{ background: 'var(--accent-b)', color: '#fff' }} title="Sync A to match B's BPM">
            SYNC {'\u2192'}
          </button>
        </div>
      </div>

      {/* Deck B controls */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1">
          <button onClick={() => nudge('B', -1)} disabled={syncLockedB} className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-b)' }}>-</button>
          <button onClick={() => resetRate('B')} className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--bg-elevated)', color: rateB === 1 ? 'var(--text-muted)' : 'var(--accent-b)' }}>{rateLabel(rateB)}</button>
          <button onClick={() => nudge('B', 1)} disabled={syncLockedB} className="px-2 py-1 rounded text-xs font-bold disabled:opacity-30" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-b)' }}>+</button>
        </div>
        {effectiveBpmB ? (
          <div className="text-[10px] font-mono font-bold tabular-nums" style={{ color: 'var(--accent-b)' }}>{effectiveBpmB} BPM</div>
        ) : (
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{videoIdB ? 'no BPM' : '---'}</div>
        )}
        <button onClick={() => toggleSyncLock('B')} disabled={!canSync} className="px-3 py-1 rounded text-[10px] font-bold uppercase transition-all disabled:opacity-30" style={{ background: syncLockedB ? 'var(--accent-b)' : 'var(--bg-elevated)', color: syncLockedB ? '#fff' : 'var(--text-muted)', boxShadow: syncLockedB ? '0 0 8px var(--accent-b)' : 'none' }}>
          {syncLockedB ? 'LOCKED' : 'LOCK'}
        </button>
      </div>
    </div>
  );
}

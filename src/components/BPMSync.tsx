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
  if (idx === -1) {
    // Not on a supported rate, snap first
    return snapToRate(current);
  }
  const newIdx = Math.max(0, Math.min(SUPPORTED_RATES.length - 1, idx + direction));
  return SUPPORTED_RATES[newIdx];
}

export default function BPMSync() {
  const bpmA = useDeckAStore((s) => s.bpm);
  const bpmB = useDeckBStore((s) => s.bpm);
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

  const syncBtoA = () => {
    if (!bpmA || !bpmB) return;
    const rate = snapToRate(bpmA / bpmB);
    setPlaybackRateB(rate);
  };

  const syncAtoB = () => {
    if (!bpmA || !bpmB) return;
    const rate = snapToRate(bpmB / bpmA);
    setPlaybackRateA(rate);
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
    if (deck === 'A') {
      const newLocked = !syncLockedA;
      setSyncLockedA(newLocked);
      if (newLocked && bpmA && bpmB) {
        setPlaybackRateA(snapToRate(bpmB / bpmA));
      }
    } else {
      const newLocked = !syncLockedB;
      setSyncLockedB(newLocked);
      if (newLocked && bpmA && bpmB) {
        setPlaybackRateB(snapToRate(bpmA / bpmB));
      }
    }
  };

  const rateLabel = (rate: number) => {
    if (rate === 1) return '1x';
    return `${rate > 1 ? '+' : ''}${((rate - 1) * 100).toFixed(0)}%`;
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      {/* Deck A controls */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => nudge('A', -1)}
            disabled={syncLockedA}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold disabled:opacity-30"
            style={{ background: 'var(--bg-elevated)', color: 'var(--accent-a)' }}
          >-</button>
          <button
            onClick={() => resetRate('A')}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: 'var(--bg-elevated)', color: rateA === 1 ? 'var(--text-muted)' : 'var(--accent-a)' }}
          >{rateLabel(rateA)}</button>
          <button
            onClick={() => nudge('A', 1)}
            disabled={syncLockedA}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold disabled:opacity-30"
            style={{ background: 'var(--bg-elevated)', color: 'var(--accent-a)' }}
          >+</button>
        </div>
        {effectiveBpmA && (
          <div className="text-[9px] font-mono tabular-nums" style={{ color: 'var(--accent-a)' }}>
            {effectiveBpmA} BPM
          </div>
        )}
        <button
          onClick={() => toggleSyncLock('A')}
          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all"
          style={{
            background: syncLockedA ? 'var(--accent-a)' : 'var(--bg-elevated)',
            color: syncLockedA ? '#fff' : 'var(--text-muted)',
            boxShadow: syncLockedA ? '0 0 6px var(--accent-a)' : 'none',
          }}
        >
          {syncLockedA ? 'LOCKED' : 'LOCK'}
        </button>
      </div>

      {/* Center: BPM diff + sync buttons */}
      <div className="flex flex-col items-center gap-1 px-2">
        {diff !== null ? (
          <div className="text-[10px] font-bold tabular-nums" style={{ color: diff <= 2 ? 'var(--vu-green)' : diff <= 5 ? 'var(--vu-yellow)' : 'var(--vu-red)' }}>
            {diff === 0 ? 'MATCHED' : `\u0394 ${diff} BPM`}
          </div>
        ) : (
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Load both tracks</div>
        )}
        <div className="flex gap-1">
          <button
            onClick={syncBtoA}
            disabled={!bpmA || !bpmB}
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase disabled:opacity-30 transition-colors"
            style={{ background: 'var(--accent-a)', color: '#fff' }}
            title="Sync B to match A's BPM"
          >
            \u2190 SYNC
          </button>
          <button
            onClick={syncAtoB}
            disabled={!bpmA || !bpmB}
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase disabled:opacity-30 transition-colors"
            style={{ background: 'var(--accent-b)', color: '#fff' }}
            title="Sync A to match B's BPM"
          >
            SYNC \u2192
          </button>
        </div>
      </div>

      {/* Deck B controls */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => nudge('B', -1)}
            disabled={syncLockedB}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold disabled:opacity-30"
            style={{ background: 'var(--bg-elevated)', color: 'var(--accent-b)' }}
          >-</button>
          <button
            onClick={() => resetRate('B')}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: 'var(--bg-elevated)', color: rateB === 1 ? 'var(--text-muted)' : 'var(--accent-b)' }}
          >{rateLabel(rateB)}</button>
          <button
            onClick={() => nudge('B', 1)}
            disabled={syncLockedB}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold disabled:opacity-30"
            style={{ background: 'var(--bg-elevated)', color: 'var(--accent-b)' }}
          >+</button>
        </div>
        {effectiveBpmB && (
          <div className="text-[9px] font-mono tabular-nums" style={{ color: 'var(--accent-b)' }}>
            {effectiveBpmB} BPM
          </div>
        )}
        <button
          onClick={() => toggleSyncLock('B')}
          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all"
          style={{
            background: syncLockedB ? 'var(--accent-b)' : 'var(--bg-elevated)',
            color: syncLockedB ? '#fff' : 'var(--text-muted)',
            boxShadow: syncLockedB ? '0 0 6px var(--accent-b)' : 'none',
          }}
        >
          {syncLockedB ? 'LOCKED' : 'LOCK'}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';

export default function BPMSync() {
  const bpmA = useDeckAStore((s) => s.bpm);
  const bpmB = useDeckBStore((s) => s.bpm);
  const playerA = useDeckAStore((s) => s.playerRef);
  const playerB = useDeckBStore((s) => s.playerRef);

  const diff = bpmA && bpmB ? Math.abs(bpmA - bpmB) : null;

  const syncBtoA = () => {
    if (!bpmA || !bpmB || !playerB) return;
    const rate = bpmA / bpmB;
    playerB.setPlaybackRate(Math.max(0.5, Math.min(2, rate)));
  };

  const syncAtoB = () => {
    if (!bpmA || !bpmB || !playerA) return;
    const rate = bpmB / bpmA;
    playerA.setPlaybackRate(Math.max(0.5, Math.min(2, rate)));
  };

  const nudge = (deck: 'A' | 'B', direction: number) => {
    const player = deck === 'A' ? playerA : playerB;
    if (!player) return;
    const current = (player as any).getPlaybackRate?.() ?? 1;
    player.setPlaybackRate(Math.max(0.5, Math.min(2, current + direction * 0.01)));
  };

  const resetRate = (deck: 'A' | 'B') => {
    const player = deck === 'A' ? playerA : playerB;
    player?.setPlaybackRate(1);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      {/* Deck A nudge */}
      <div className="flex items-center gap-1">
        <button onClick={() => nudge('A', -1)} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-a)' }}>-</button>
        <button onClick={() => resetRate('A')} className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>1x</button>
        <button onClick={() => nudge('A', 1)} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-a)' }}>+</button>
      </div>

      {/* BPM diff + sync buttons */}
      <div className="flex flex-col items-center gap-1">
        {diff !== null ? (
          <div className="text-[10px] font-bold tabular-nums" style={{ color: diff <= 2 ? 'var(--vu-green)' : diff <= 5 ? 'var(--vu-yellow)' : 'var(--vu-red)' }}>
            {diff === 0 ? 'MATCHED' : `Δ ${diff.toFixed(1)} BPM`}
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
            ← SYNC
          </button>
          <button
            onClick={syncAtoB}
            disabled={!bpmA || !bpmB}
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase disabled:opacity-30 transition-colors"
            style={{ background: 'var(--accent-b)', color: '#fff' }}
            title="Sync A to match B's BPM"
          >
            SYNC →
          </button>
        </div>
      </div>

      {/* Deck B nudge */}
      <div className="flex items-center gap-1">
        <button onClick={() => nudge('B', -1)} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-b)' }}>-</button>
        <button onClick={() => resetRate('B')} className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>1x</button>
        <button onClick={() => nudge('B', 1)} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-b)' }}>+</button>
      </div>
    </div>
  );
}

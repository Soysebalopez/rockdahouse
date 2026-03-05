'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';
import { useMixerStore } from '@/stores/useMixerStore';

type CueTarget = 'A' | 'B' | null;

export default function CueControls() {
  const [cueTarget, setCueTarget] = useState<CueTarget>(null);
  const [cueMix, setCueMix] = useState(0.5); // 0 = full cue, 1 = full master

  const playerA = useDeckAStore((s) => s.playerRef);
  const playerB = useDeckBStore((s) => s.playerRef);

  // When CUE is active, override volumes to solo the cue deck
  useEffect(() => {
    if (!cueTarget) return;

    const applyVolumes = () => {
      const dA = useDeckAStore.getState();
      const dB = useDeckBStore.getState();
      const mx = useMixerStore.getState();
      const pos = mx.crossfaderPosition;
      const gainA = Math.cos(pos * Math.PI / 2);
      const gainB = Math.sin(pos * Math.PI / 2);

      if (cueTarget === 'A') {
        // Cue deck A: blend between solo A (cue) and normal mix (master)
        const cueVol = (1 - cueMix) * dA.volume * 100;
        const masterVolA = cueMix * dA.volume * gainA * mx.masterVolume * 100;
        const masterVolB = cueMix * dB.volume * gainB * mx.masterVolume * 100;
        dA.playerRef?.setVolume(Math.max(cueVol, masterVolA));
        dB.playerRef?.setVolume(masterVolB);
      } else {
        // Cue deck B
        const cueVol = (1 - cueMix) * dB.volume * 100;
        const masterVolA = cueMix * dA.volume * gainA * mx.masterVolume * 100;
        const masterVolB = cueMix * dB.volume * gainB * mx.masterVolume * 100;
        dA.playerRef?.setVolume(masterVolA);
        dB.playerRef?.setVolume(Math.max(cueVol, masterVolB));
      }
    };

    applyVolumes();
    const interval = setInterval(applyVolumes, 100);
    return () => clearInterval(interval);
  }, [cueTarget, cueMix, playerA, playerB]);

  const toggleCue = useCallback((deck: CueTarget) => {
    setCueTarget((prev) => prev === deck ? null : deck);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>CUE</div>

      <button
        onClick={() => toggleCue('A')}
        className="px-3 py-1 rounded text-xs font-bold uppercase transition-colors"
        style={{
          background: cueTarget === 'A' ? 'var(--accent-a)' : 'var(--bg-elevated)',
          color: cueTarget === 'A' ? '#fff' : 'var(--text-secondary)',
          boxShadow: cueTarget === 'A' ? '0 0 8px var(--accent-a)' : 'none',
        }}
      >
        🎧 A
      </button>

      <button
        onClick={() => toggleCue('B')}
        className="px-3 py-1 rounded text-xs font-bold uppercase transition-colors"
        style={{
          background: cueTarget === 'B' ? 'var(--accent-b)' : 'var(--bg-elevated)',
          color: cueTarget === 'B' ? '#fff' : 'var(--text-secondary)',
          boxShadow: cueTarget === 'B' ? '0 0 8px var(--accent-b)' : 'none',
        }}
      >
        🎧 B
      </button>

      {cueTarget && (
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>CUE</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={cueMix}
            onChange={(e) => setCueMix(parseFloat(e.target.value))}
            style={{ width: 80, height: 20 }}
          />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>MST</span>
        </div>
      )}
    </div>
  );
}

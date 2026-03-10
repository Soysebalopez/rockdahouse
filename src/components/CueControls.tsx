'use client';

import { useMixerStore } from '@/stores/useMixerStore';
import Knob from './Knob';
import type { DeckId } from '@/lib/types';

const ACCENT_COLORS: Record<DeckId, string> = {
  A: 'var(--accent-a)',
  B: 'var(--accent-b)',
  C: 'var(--accent-c)',
  D: 'var(--accent-d)',
};

export default function CueControls() {
  const cueTargets = useMixerStore((s) => s.cueTargets);
  const cueMix = useMixerStore((s) => s.cueMix);
  const toggleCue = useMixerStore((s) => s.toggleCue);
  const setCueMix = useMixerStore((s) => s.setCueMix);
  const deckMode = useMixerStore((s) => s.deckMode);

  const activeDecks: DeckId[] = deckMode === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B'];
  const anyCued = activeDecks.some((id) => cueTargets[id]);

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>CUE</div>

      {activeDecks.map((id) => (
        <button
          key={id}
          onClick={() => toggleCue(id)}
          className="px-3 py-1 rounded text-xs font-bold uppercase transition-colors"
          style={{
            background: cueTargets[id] ? ACCENT_COLORS[id] : 'var(--bg-elevated)',
            color: cueTargets[id] ? '#fff' : 'var(--text-secondary)',
            boxShadow: cueTargets[id] ? `0 0 8px ${ACCENT_COLORS[id]}` : 'none',
          }}
        >
          {id}
        </button>
      ))}

      {anyCued && (
        <Knob
          value={cueMix * 100}
          min={0}
          max={100}
          onChange={(v) => setCueMix(v / 100)}
          label="CUE/MST"
          size={36}
          accentColor="var(--text-primary)"
        />
      )}
    </div>
  );
}

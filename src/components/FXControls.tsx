'use client';

import type { DeckId } from '@/lib/types';
import { useEffectsStore, type EffectType } from '@/stores/useEffectsStore';

interface FXControlsProps {
  deckId: DeckId;
  accentColor: string;
}

const EFFECTS: { type: EffectType; label: string; icon: string }[] = [
  { type: 'brake', label: 'BRK', icon: '⏚' },
  { type: 'spinback', label: 'SPIN', icon: '↺' },
  { type: 'beatRepeat', label: 'RPT', icon: '⟳' },
  { type: 'echoOut', label: 'ECHO', icon: '◌' },
  { type: 'filterSweep', label: 'FLT', icon: '∿' },
];

export default function FXControls({ deckId, accentColor }: FXControlsProps) {
  const deckEffect = useEffectsStore((s) => s.decks[deckId]);
  const startEffect = useEffectsStore((s) => s.startEffect);

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[10px] font-bold tracking-wider uppercase mr-1"
        style={{ color: 'var(--text-muted)' }}
      >
        FX
      </span>
      {EFFECTS.map(({ type, label, icon }) => {
        const isActive = deckEffect.active === type;
        return (
          <button
            key={type}
            onClick={() => startEffect(deckId, type)}
            className="px-2 py-1 rounded text-[10px] font-bold transition-all relative overflow-hidden"
            style={{
              background: isActive ? accentColor : 'var(--bg-elevated)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              boxShadow: isActive ? `0 0 8px ${accentColor}` : 'none',
            }}
            title={type}
          >
            {/* Progress bar overlay */}
            {isActive && deckEffect.progress > 0 && (
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: '#000',
                  clipPath: `inset(0 ${(1 - deckEffect.progress) * 100}% 0 0)`,
                  transition: 'clip-path 60ms linear',
                }}
              />
            )}
            <span className="relative z-10">
              {icon} {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

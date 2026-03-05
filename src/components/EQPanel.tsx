'use client';

import { EQ_BANDS } from '@/stores/useDeckStore';

interface EQPanelProps {
  bands: number[];
  onBandChange: (index: number, gain: number) => void;
  onReset: () => void;
  accentColor: string;
  accentHex: string;
}

export default function EQPanel({ bands, onBandChange, onReset, accentColor, accentHex }: EQPanelProps) {
  return (
    <div
      className="rounded-lg p-3 animate-slide-up"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
          8-BAND EQ
        </span>
        <button
          onClick={onReset}
          className="text-[9px] px-1.5 py-0.5 rounded"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
        >
          FLAT
        </button>
      </div>

      <div className="flex gap-1.5 items-end">
        {bands.map((gain, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            {/* Gain label */}
            <span
              className="text-[8px] font-mono tabular-nums"
              style={{ color: gain !== 0 ? accentColor : 'var(--text-muted)' }}
            >
              {gain > 0 ? '+' : ''}{gain}
            </span>

            {/* Vertical slider track */}
            <div className="relative flex flex-col items-center" style={{ height: 80 }}>
              {/* Track background */}
              <div
                className="absolute w-1 rounded-full"
                style={{
                  height: '100%',
                  background: 'var(--fader-track)',
                }}
              />

              {/* Center line (0 dB) */}
              <div
                className="absolute w-3 h-px"
                style={{
                  top: '50%',
                  background: 'var(--border-default)',
                }}
              />

              {/* Fill bar from center */}
              <div
                className="absolute w-1 rounded-full"
                style={{
                  top: gain > 0 ? `${50 - (gain / 12) * 50}%` : '50%',
                  height: `${Math.abs(gain) / 12 * 50}%`,
                  background: `${accentHex}80`,
                }}
              />

              {/* Slider input */}
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={gain}
                onChange={(e) => onBandChange(i, Number(e.target.value))}
                onDoubleClick={() => onBandChange(i, 0)}
                className="absolute vertical"
                style={{
                  height: 80,
                  width: 24,
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 1,
                }}
                title={`${EQ_BANDS[i]}Hz: ${gain > 0 ? '+' : ''}${gain}dB (double-click to reset)`}
              />

              {/* Thumb indicator */}
              <div
                className="absolute w-3 h-1.5 rounded-sm"
                style={{
                  top: `${50 - (gain / 12) * 50 - 3}%`,
                  background: gain !== 0 ? accentHex : 'var(--fader-thumb)',
                  boxShadow: gain !== 0 ? `0 0 4px ${accentHex}60` : 'none',
                  transition: 'top 50ms ease',
                }}
              />
            </div>

            {/* Frequency label */}
            <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {EQ_BANDS[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

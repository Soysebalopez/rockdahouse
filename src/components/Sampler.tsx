'use client';

import { useRef } from 'react';
import { useSamplerStore } from '@/stores/useSamplerStore';
import Knob from './Knob';

export default function Sampler() {
  const volume = useSamplerStore((s) => s.volume);
  const setVolume = useSamplerStore((s) => s.setVolume);
  const pads = useSamplerStore((s) => s.pads);
  const triggerPad = useSamplerStore((s) => s.triggerPad);
  const stopPad = useSamplerStore((s) => s.stopPad);
  const loadCustomSample = useSamplerStore((s) => s.loadCustomSample);
  const togglePadLoop = useSamplerStore((s) => s.togglePadLoop);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadCustomSample(index, file);
    e.target.value = '';
  };

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold tracking-wider uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            SAMPLER
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          >
            16 PADS
          </span>
        </div>
        <Knob
          value={volume}
          min={0}
          max={1}
          onChange={setVolume}
          label="VOL"
          size={28}
          accentColor="var(--accent-a)"
        />
      </div>

      {/* Compact pad grid: 8 columns x 2 rows */}
      <div className="px-3 pb-2">
        <div className="grid grid-cols-8 gap-1">
          {pads.map((pad, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <button
                onMouseDown={() => triggerPad(i)}
                onMouseUp={() => pad.isLoop && stopPad(i)}
                onMouseLeave={() => pad.isLoop && pad.isPlaying && stopPad(i)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  fileInputRefs.current[i]?.click();
                }}
                className="relative rounded-md flex flex-col items-center justify-center transition-all active:scale-95 py-1.5"
                style={{
                  background: pad.isPlaying
                    ? pad.color
                    : `${pad.color}20`,
                  border: `1px solid ${pad.color}60`,
                  boxShadow: pad.isPlaying ? `0 0 8px ${pad.color}80` : 'none',
                }}
                title={`${pad.name} (right-click to load sample)`}
              >
                <span
                  className="text-[9px] font-bold leading-none"
                  style={{ color: pad.isPlaying ? '#fff' : pad.color }}
                >
                  {pad.name}
                </span>
                {pad.isLoop && (
                  <span
                    className="absolute top-0 right-0 text-[6px] px-0.5 rounded-bl"
                    style={{ background: `${pad.color}40`, color: pad.color }}
                  >
                    LP
                  </span>
                )}
              </button>
              <input
                ref={(el) => { fileInputRefs.current[i] = el; }}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleFileUpload(i, e)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

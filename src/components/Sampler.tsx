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
      className="rounded-xl overflow-hidden flex flex-col h-full"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
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
          size={32}
          accentColor="var(--accent-a)"
        />
      </div>

      {/* Pads — always visible, fills remaining space */}
      <div className="px-4 pb-4 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-4 gap-2">
          {pads.map((pad, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <button
                onMouseDown={() => triggerPad(i)}
                onMouseUp={() => pad.isLoop && stopPad(i)}
                onMouseLeave={() => pad.isLoop && pad.isPlaying && stopPad(i)}
                className="relative aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
                style={{
                  background: pad.isPlaying
                    ? pad.color
                    : `${pad.color}20`,
                  border: `1px solid ${pad.color}60`,
                  boxShadow: pad.isPlaying ? `0 0 12px ${pad.color}80` : 'none',
                }}
              >
                <span
                  className="text-[11px] font-bold"
                  style={{ color: pad.isPlaying ? '#fff' : pad.color }}
                >
                  {pad.name}
                </span>
                <span
                  className="text-[8px]"
                  style={{ color: pad.isPlaying ? '#fff8' : `${pad.color}80` }}
                >
                  {i + 1}
                </span>
                {pad.isLoop && (
                  <span
                    className="absolute top-0.5 right-0.5 text-[7px] px-0.5 rounded"
                    style={{ background: `${pad.color}40`, color: pad.color }}
                  >
                    LP
                  </span>
                )}
                {pad.isCustom && (
                  <span
                    className="absolute top-0.5 left-0.5 text-[7px] px-0.5 rounded"
                    style={{ background: `${pad.color}40`, color: pad.color }}
                  >
                    ✦
                  </span>
                )}
              </button>
              {/* Pad actions */}
              <div className="flex gap-0.5 justify-center">
                <button
                  onClick={() => togglePadLoop(i)}
                  className="text-[8px] px-1 rounded"
                  style={{
                    background: pad.isLoop ? pad.color : 'var(--bg-elevated)',
                    color: pad.isLoop ? '#fff' : 'var(--text-muted)',
                  }}
                  title="Toggle loop mode"
                >
                  ⟳
                </button>
                <button
                  onClick={() => fileInputRefs.current[i]?.click()}
                  className="text-[8px] px-1 rounded"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                  title="Load custom sample"
                >
                  ↑
                </button>
                <input
                  ref={(el) => { fileInputRefs.current[i] = el; }}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(i, e)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback } from 'react';

interface LoopControlsProps {
  bpm: number | null;
  currentTime: number;
  loop: { active: boolean; start: number; end: number; beats: number | null };
  onSetLoop: (loop: { active: boolean; start: number; end: number; beats: number | null }) => void;
  onClearLoop: () => void;
  accentColor: string;
}

export default function LoopControls({ bpm, currentTime, loop, onSetLoop, onClearLoop, accentColor }: LoopControlsProps) {
  const activateLoop = useCallback((beats: number) => {
    if (!bpm || bpm <= 0) return;
    const beatDuration = 60 / bpm;
    const loopDuration = beatDuration * beats;
    const start = currentTime;
    const end = currentTime + loopDuration;
    onSetLoop({ active: true, start, end, beats });
  }, [bpm, currentTime, onSetLoop]);

  const toggleLoop = useCallback(() => {
    if (loop.active) {
      onClearLoop();
    }
  }, [loop.active, onClearLoop]);

  const setLoopIn = useCallback(() => {
    onSetLoop({ ...loop, active: true, start: currentTime, beats: null });
  }, [currentTime, loop, onSetLoop]);

  const setLoopOut = useCallback(() => {
    if (loop.start > 0) {
      onSetLoop({ ...loop, active: true, end: currentTime, beats: null });
    }
  }, [currentTime, loop, onSetLoop]);

  const beatButtons = [4, 8, 16];

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold tracking-wider uppercase mr-1" style={{ color: 'var(--text-muted)' }}>LOOP</span>

      {beatButtons.map((beats) => (
        <button
          key={beats}
          onClick={() => loop.active && loop.beats === beats ? onClearLoop() : activateLoop(beats)}
          disabled={!bpm}
          className="px-2 py-1 rounded text-[11px] font-bold tabular-nums transition-all disabled:opacity-30"
          style={{
            background: loop.active && loop.beats === beats ? accentColor : 'var(--bg-elevated)',
            color: loop.active && loop.beats === beats ? '#fff' : 'var(--text-secondary)',
            boxShadow: loop.active && loop.beats === beats ? `0 0 6px ${accentColor}` : 'none',
          }}
        >
          {beats}
        </button>
      ))}

      <div className="flex gap-0.5 ml-1">
        <button
          onClick={setLoopIn}
          className="px-1.5 py-1 rounded text-[10px] font-bold transition-colors"
          style={{
            background: loop.active && loop.beats === null ? accentColor : 'var(--bg-elevated)',
            color: loop.active && loop.beats === null ? '#fff' : 'var(--text-muted)',
          }}
        >
          IN
        </button>
        <button
          onClick={setLoopOut}
          className="px-1.5 py-1 rounded text-[10px] font-bold transition-colors"
          style={{
            background: loop.active && loop.beats === null && loop.end > 0 ? accentColor : 'var(--bg-elevated)',
            color: 'var(--text-muted)',
          }}
        >
          OUT
        </button>
      </div>

      {loop.active && (
        <button
          onClick={toggleLoop}
          className="px-2 py-1 rounded text-[10px] font-bold uppercase"
          style={{ background: 'var(--vu-red)', color: '#fff' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useMemo } from 'react';
import { generateWaveformData } from '@/lib/waveform';
import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';

const BARS = 300;
const HEIGHT = 120;

const COLORS = {
  A: { accent: '#ec4899', dim: '#9d174d', grid: 'rgba(236, 72, 153, 0.25)' },
  B: { accent: '#3b82f6', dim: '#1e40af', grid: 'rgba(59, 130, 246, 0.25)' },
};

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

export default function DualWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(undefined);

  const videoIdA = useDeckAStore((s) => s.videoId);
  const videoIdB = useDeckBStore((s) => s.videoId);

  const dataA = useMemo(() => videoIdA ? generateWaveformData(videoIdA, BARS) : null, [videoIdA]);
  const dataB = useMemo(() => videoIdB ? generateWaveformData(videoIdB, BARS) : null, [videoIdB]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const draw = () => {
      const width = container.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      const cw = Math.floor(width * dpr);
      const ch = Math.floor(HEIGHT * dpr);

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) { animRef.current = requestAnimationFrame(draw); return; }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, HEIGHT);

      // Dark background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, width, HEIGHT);

      const stateA = useDeckAStore.getState();
      const stateB = useDeckBStore.getState();
      const barWidth = width / BARS;
      const gap = 1;
      const maxBarH = HEIGHT - 8;

      // === DECK A: bars grow UPWARD from bottom ===
      if (dataA && stateA.duration > 0) {
        const progressA = stateA.currentTime / stateA.duration;

        // Beat grid A
        if (stateA.bpm) {
          const effBpm = stateA.bpm * stateA.playbackRate;
          const beatSec = 60 / effBpm;
          ctx.strokeStyle = COLORS.A.grid;
          ctx.lineWidth = 1.5;
          for (let t = 0; t < stateA.duration; t += beatSec) {
            const x = (t / stateA.duration) * width;
            if (x > width) break;
            ctx.beginPath();
            ctx.moveTo(x, HEIGHT);
            ctx.lineTo(x, HEIGHT * 0.5);
            ctx.stroke();
          }
        }

        // Loop region A
        if (stateA.loop.active && stateA.loop.end > 0) {
          const lsX = (stateA.loop.start / stateA.duration) * width;
          const leX = Math.min((stateA.loop.end / stateA.duration) * width, width);
          ctx.fillStyle = 'rgba(236, 72, 153, 0.08)';
          ctx.fillRect(lsX, 0, leX - lsX, HEIGHT);
        }

        // Waveform bars A (from bottom up)
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < BARS; i++) {
          const x = i * barWidth;
          const amp = dataA[i];
          const barH = amp * maxBarH;
          const barProgress = i / BARS;
          const isPlayed = barProgress <= progressA;
          ctx.fillStyle = isPlayed ? COLORS.A.accent : COLORS.A.dim;
          ctx.fillRect(x + gap / 2, HEIGHT - barH, barWidth - gap, barH);
        }
        ctx.globalAlpha = 1;

        // Hot cue markers A
        const cuesA = stateA.hotCues;
        if (cuesA) {
          for (const cue of cuesA) {
            if (!cue) continue;
            const cx = (cue.time / stateA.duration) * width;
            ctx.fillStyle = cue.color;
            ctx.beginPath();
            ctx.moveTo(cx - 4, HEIGHT);
            ctx.lineTo(cx + 4, HEIGHT);
            ctx.lineTo(cx, HEIGHT - 8);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Playhead A — glow + solid
        const pxA = progressA * width;
        ctx.shadowColor = COLORS.A.accent;
        ctx.shadowBlur = 6;
        ctx.fillStyle = COLORS.A.accent;
        ctx.fillRect(pxA - 1.5, 0, 3, HEIGHT);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pxA - 0.5, 0, 1, HEIGHT);
      }

      // === DECK B: bars grow DOWNWARD from top ===
      if (dataB && stateB.duration > 0) {
        const progressB = stateB.currentTime / stateB.duration;

        // Beat grid B
        if (stateB.bpm) {
          const effBpm = stateB.bpm * stateB.playbackRate;
          const beatSec = 60 / effBpm;
          ctx.strokeStyle = COLORS.B.grid;
          ctx.lineWidth = 1.5;
          for (let t = 0; t < stateB.duration; t += beatSec) {
            const x = (t / stateB.duration) * width;
            if (x > width) break;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, HEIGHT * 0.5);
            ctx.stroke();
          }
        }

        // Loop region B
        if (stateB.loop.active && stateB.loop.end > 0) {
          const lsX = (stateB.loop.start / stateB.duration) * width;
          const leX = Math.min((stateB.loop.end / stateB.duration) * width, width);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
          ctx.fillRect(lsX, 0, leX - lsX, HEIGHT);
        }

        // Waveform bars B (from top down)
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < BARS; i++) {
          const x = i * barWidth;
          const amp = dataB[i];
          const barH = amp * maxBarH;
          const barProgress = i / BARS;
          const isPlayed = barProgress <= progressB;
          ctx.fillStyle = isPlayed ? COLORS.B.accent : COLORS.B.dim;
          ctx.fillRect(x + gap / 2, 0, barWidth - gap, barH);
        }
        ctx.globalAlpha = 1;

        // Hot cue markers B
        const cuesB = stateB.hotCues;
        if (cuesB) {
          for (const cue of cuesB) {
            if (!cue) continue;
            const cx = (cue.time / stateB.duration) * width;
            ctx.fillStyle = cue.color;
            ctx.beginPath();
            ctx.moveTo(cx - 4, 0);
            ctx.lineTo(cx + 4, 0);
            ctx.lineTo(cx, 8);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Playhead B — glow + solid
        const pxB = progressB * width;
        ctx.shadowColor = COLORS.B.accent;
        ctx.shadowBlur = 6;
        ctx.fillStyle = COLORS.B.accent;
        ctx.fillRect(pxB - 1.5, 0, 3, HEIGHT);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pxB - 0.5, 0, 1, HEIGHT);
      }

      // === Labels ===
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px system-ui, sans-serif';

      // Deck A label (bottom-left)
      const titleA = stateA.title ? truncate(stateA.title, 30) : '';
      const effBpmA = stateA.bpm ? Math.round(stateA.bpm * stateA.playbackRate) : null;
      ctx.fillStyle = COLORS.A.accent;
      ctx.textAlign = 'left';
      ctx.fillText(`A${titleA ? ': ' + titleA : ''}`, 6, HEIGHT - 6);
      if (effBpmA) {
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${effBpmA} BPM`, width - 6, HEIGHT - 6);
      }

      // Deck B label (top-left)
      const titleB = stateB.title ? truncate(stateB.title, 30) : '';
      const effBpmB = stateB.bpm ? Math.round(stateB.bpm * stateB.playbackRate) : null;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = COLORS.B.accent;
      ctx.textAlign = 'left';
      ctx.fillText(`B${titleB ? ': ' + titleB : ''}`, 6, 14);
      if (effBpmB) {
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${effBpmB} BPM`, width - 6, 14);
      }

      // Center line (subtle)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(0, HEIGHT / 2 - 0.5, width, 1);

      // Placeholder if no tracks
      if (!dataA && !dataB) {
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.textAlign = 'center';
        ctx.fillText('Load tracks to see waveforms', width / 2, HEIGHT / 2 + 4);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [dataA, dataB]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{
        height: HEIGHT,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: HEIGHT, display: 'block' }}
      />
    </div>
  );
}

'use client';

import { useEffect, useRef, useMemo } from 'react';
import { generateWaveformData } from '@/lib/waveform';
import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';

const BARS = 200;
const HEIGHT = 100;
const HALF = HEIGHT / 2;

const COLORS = {
  A: { accent: '#ec4899', dim: '#9d174d' },
  B: { accent: '#3b82f6', dim: '#1e40af' },
};

// YouTube-supported playback rates
const SUPPORTED_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function snapToRate(rate: number): number {
  let closest = SUPPORTED_RATES[0];
  let minDiff = Math.abs(rate - closest);
  for (const r of SUPPORTED_RATES) {
    const diff = Math.abs(rate - r);
    if (diff < minDiff) {
      minDiff = diff;
      closest = r;
    }
  }
  return closest;
}

export default function DualWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(undefined);

  // Generate waveform data reactively when videoId changes
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
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== HEIGHT) canvas.height = HEIGHT;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const stateA = useDeckAStore.getState();
      const stateB = useDeckBStore.getState();

      ctx.clearRect(0, 0, width, HEIGHT);

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, width, HEIGHT);

      const barWidth = width / BARS;
      const gap = 1;

      // Draw Deck A (top half — bars grow upward from center)
      if (dataA && stateA.duration > 0) {
        const progressA = stateA.currentTime / stateA.duration;

        // Beat grid for A
        if (stateA.bpm) {
          const effectiveBpm = stateA.bpm * stateA.playbackRate;
          const beatInterval = 60 / effectiveBpm;
          const totalBeats = stateA.duration / beatInterval;
          ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
          ctx.lineWidth = 1;
          for (let b = 0; b < totalBeats; b++) {
            const beatTime = b * beatInterval;
            const x = (beatTime / stateA.duration) * width;
            if (x > width) break;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, HALF);
            ctx.stroke();
          }
        }

        // Loop region
        if (stateA.loop.active && stateA.loop.end > 0) {
          const lsX = (stateA.loop.start / stateA.duration) * width;
          const leX = (stateA.loop.end / stateA.duration) * width;
          ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
          ctx.fillRect(lsX, 0, leX - lsX, HALF);
        }

        // Waveform bars
        for (let i = 0; i < BARS; i++) {
          const x = i * barWidth;
          const amp = dataA[i];
          const barH = amp * (HALF - 4);
          const y = HALF - barH;
          const barProgress = i / BARS;
          const isPlayed = barProgress <= progressA;

          ctx.fillStyle = isPlayed ? COLORS.A.accent : COLORS.A.dim;
          ctx.globalAlpha = isPlayed ? 1 : 0.5;
          ctx.fillRect(x + gap / 2, y, barWidth - gap, barH);
        }
        ctx.globalAlpha = 1;

        // Playhead A
        const pxA = progressA * width;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pxA - 1, 0, 2, HALF);
      }

      // Draw Deck B (bottom half — bars grow downward from center)
      if (dataB && stateB.duration > 0) {
        const progressB = stateB.currentTime / stateB.duration;

        // Beat grid for B
        if (stateB.bpm) {
          const effectiveBpm = stateB.bpm * stateB.playbackRate;
          const beatInterval = 60 / effectiveBpm;
          const totalBeats = stateB.duration / beatInterval;
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.lineWidth = 1;
          for (let b = 0; b < totalBeats; b++) {
            const beatTime = b * beatInterval;
            const x = (beatTime / stateB.duration) * width;
            if (x > width) break;
            ctx.beginPath();
            ctx.moveTo(x, HALF);
            ctx.lineTo(x, HEIGHT);
            ctx.stroke();
          }
        }

        // Loop region
        if (stateB.loop.active && stateB.loop.end > 0) {
          const lsX = (stateB.loop.start / stateB.duration) * width;
          const leX = (stateB.loop.end / stateB.duration) * width;
          ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
          ctx.fillRect(lsX, HALF, leX - lsX, HALF);
        }

        // Waveform bars
        for (let i = 0; i < BARS; i++) {
          const x = i * barWidth;
          const amp = dataB[i];
          const barH = amp * (HALF - 4);
          const barProgress = i / BARS;
          const isPlayed = barProgress <= progressB;

          ctx.fillStyle = isPlayed ? COLORS.B.accent : COLORS.B.dim;
          ctx.globalAlpha = isPlayed ? 1 : 0.5;
          ctx.fillRect(x + gap / 2, HALF, barWidth - gap, barH);
        }
        ctx.globalAlpha = 1;

        // Playhead B
        const pxB = progressB * width;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pxB - 1, HALF, 2, HALF);
      }

      // Center dividing line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(0, HALF - 0.5, width, 1);

      // Deck labels
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = COLORS.A.accent;
      ctx.fillText('A', 4, 12);
      ctx.fillStyle = COLORS.B.accent;
      ctx.fillText('B', 4, HEIGHT - 4);

      // Effective BPM labels
      if (stateA.bpm) {
        const effA = Math.round(stateA.bpm * stateA.playbackRate);
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(236, 72, 153, 0.8)';
        ctx.textAlign = 'right';
        ctx.fillText(`${effA} BPM`, width - 4, 12);
        ctx.textAlign = 'left';
      }
      if (stateB.bpm) {
        const effB = Math.round(stateB.bpm * stateB.playbackRate);
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.textAlign = 'right';
        ctx.fillText(`${effB} BPM`, width - 4, HEIGHT - 4);
        ctx.textAlign = 'left';
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [dataA, dataB]);

  const hasAnyTrack = videoIdA || videoIdB;

  if (!hasAnyTrack) return null;

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
      <canvas ref={canvasRef} style={{ width: '100%', height: HEIGHT }} />
    </div>
  );
}

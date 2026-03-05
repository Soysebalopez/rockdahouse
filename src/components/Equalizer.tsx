'use client';

import { useEffect, useRef } from 'react';
import { useDeckAStore, useDeckBStore, useDeckCStore, useDeckDStore } from '@/stores/useDeckStore';
import { useMixerStore } from '@/stores/useMixerStore';
import { getMasterFFTData } from '@/hooks/useAudioEngine';

const BAR_COUNT = 32;
const BAR_GAP = 2;
const SMOOTHING = 0.12;
const HEIGHT = 80;

// Rainbow gradient colors for bars
function barColor(index: number, total: number): string {
  const hue = (index / total) * 360;
  return `hsl(${hue}, 85%, 55%)`;
}

export default function Equalizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelsRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));
  const animRef = useRef<number>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = HEIGHT * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = HEIGHT;

      // Check if any deck is playing
      const stores = [useDeckAStore, useDeckBStore, useDeckCStore, useDeckDStore];
      const deckMode = useMixerStore.getState().deckMode;
      const activeStores = deckMode === 4 ? stores : stores.slice(0, 2);
      const anyPlaying = activeStores.some((s) => s.getState().isPlaying);

      // Try real FFT data from master analyser
      const fftData = getMasterFFTData();
      const anyAudioEngine = activeStores.some((s) => s.getState().audioEngineActive);
      const useRealFFT = fftData && anyAudioEngine && anyPlaying;

      // Update levels with smoothing
      const levels = levelsRef.current;
      for (let i = 0; i < BAR_COUNT; i++) {
        let target: number;
        if (useRealFFT) {
          // Map BAR_COUNT bars to FFT bins (fftData has frequencyBinCount entries, 0-255 each)
          const binIndex = Math.floor((i / BAR_COUNT) * fftData.length);
          target = fftData[binIndex] / 255;
        } else {
          const boost = anyPlaying ? 0.85 : 0.15;
          target = Math.random() * boost;
        }
        levels[i] += (target - levels[i]) * SMOOTHING;
      }

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Draw bars
      const barWidth = (w - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;
      for (let i = 0; i < BAR_COUNT; i++) {
        const barHeight = levels[i] * h * 0.9;
        const x = i * (barWidth + BAR_GAP);
        const y = h - barHeight;

        ctx.fillStyle = barColor(i, BAR_COUNT);
        ctx.globalAlpha = 0.7 + levels[i] * 0.3;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div
      className="w-full rounded-lg overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: HEIGHT, display: 'block' }}
      />
    </div>
  );
}

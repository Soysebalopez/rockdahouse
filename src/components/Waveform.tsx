'use client';

import { useEffect, useRef, useMemo } from 'react';
import { generateWaveformData } from '@/lib/waveform';
import type { HotCue } from '@/stores/useDeckStore';

interface WaveformProps {
  videoId: string | null;
  currentTime: number;
  duration: number;
  accentColor: string;
  dimColor: string;
  height?: number;
  loop?: { start: number; end: number };
  hotCues?: (HotCue | null)[];
}

export default function Waveform({ videoId, currentTime, duration, accentColor, dimColor, height = 48, loop, hotCues }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const waveformData = useMemo(
    () => videoId ? generateWaveformData(videoId, 200) : null,
    [videoId]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !waveformData) return;

    const width = container.clientWidth;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const progress = duration > 0 ? currentTime / duration : 0;
    const barCount = waveformData.length;
    const barWidth = width / barCount;
    const gap = 1;

    ctx.clearRect(0, 0, width, height);

    // Draw loop region background
    if (loop && duration > 0) {
      const loopStartX = (loop.start / duration) * width;
      const loopEndX = (loop.end / duration) * width;
      ctx.fillStyle = `${accentColor}22`;
      ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, height);
    }

    // Draw bars
    for (let i = 0; i < barCount; i++) {
      const x = i * barWidth;
      const barH = waveformData[i] * (height - 4);
      const y = (height - barH) / 2;
      const barProgress = i / barCount;
      const isPlayed = barProgress <= progress;

      // Check if bar is inside loop region
      const isInLoop = loop && duration > 0 &&
        barProgress >= (loop.start / duration) &&
        barProgress <= (loop.end / duration);

      if (isInLoop) {
        ctx.fillStyle = isPlayed ? accentColor : `${accentColor}88`;
      } else {
        ctx.fillStyle = isPlayed ? accentColor : dimColor;
      }

      ctx.fillRect(x + gap / 2, y, barWidth - gap, barH);
    }

    // Draw hot cue markers
    if (hotCues && duration > 0) {
      hotCues.forEach((cue) => {
        if (!cue) return;
        const cueX = (cue.time / duration) * width;
        ctx.fillStyle = cue.color;
        // Triangle marker at top
        ctx.beginPath();
        ctx.moveTo(cueX - 4, 0);
        ctx.lineTo(cueX + 4, 0);
        ctx.lineTo(cueX, 7);
        ctx.closePath();
        ctx.fill();
        // Vertical line
        ctx.fillRect(cueX - 0.5, 0, 1, height);
      });
    }

    // Loop boundary lines
    if (loop && duration > 0) {
      ctx.fillStyle = accentColor;
      const loopStartX = (loop.start / duration) * width;
      const loopEndX = (loop.end / duration) * width;
      ctx.fillRect(loopStartX - 1, 0, 2, height);
      ctx.fillRect(loopEndX - 1, 0, 2, height);
    }

    // Playhead
    if (duration > 0) {
      const px = progress * width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, 0, 2, height);
    }
  }, [waveformData, currentTime, duration, accentColor, dimColor, height, loop, hotCues]);

  if (!videoId) {
    return (
      <div className="w-full rounded" style={{ height, background: 'var(--bg-elevated)' }} />
    );
  }

  return (
    <div ref={containerRef} className="w-full rounded overflow-hidden" style={{ height, background: 'var(--bg-elevated)' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height }} />
    </div>
  );
}

'use client';

import { useEffect, useRef, useMemo } from 'react';

interface WaveformProps {
  videoId: string | null;
  currentTime: number;
  duration: number;
  accentColor: string;
  dimColor: string;
  height?: number;
}

// Generate deterministic waveform data from videoId
function generateWaveformData(seed: string, bars: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }

  const data: number[] = [];
  for (let i = 0; i < bars; i++) {
    // Simple PRNG seeded by hash + bar index
    hash = ((hash * 1103515245 + 12345) & 0x7fffffff);
    const base = (hash % 1000) / 1000;
    // Shape: louder in middle, quieter at edges (simulates a real track)
    const position = i / bars;
    const envelope = Math.sin(position * Math.PI) * 0.5 + 0.5;
    // Add some "verse/chorus" dynamics
    const section = Math.sin(position * Math.PI * 6) * 0.15;
    data.push(Math.max(0.08, Math.min(1, base * 0.6 * envelope + section + 0.2)));
  }
  return data;
}

export default function Waveform({ videoId, currentTime, duration, accentColor, dimColor, height = 48 }: WaveformProps) {
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

    for (let i = 0; i < barCount; i++) {
      const x = i * barWidth;
      const barH = waveformData[i] * (height - 4);
      const y = (height - barH) / 2;
      const isPlayed = (i / barCount) <= progress;

      ctx.fillStyle = isPlayed ? accentColor : dimColor;
      ctx.fillRect(x + gap / 2, y, barWidth - gap, barH);
    }

    // Playhead line
    if (duration > 0) {
      const px = progress * width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, 0, 2, height);
    }
  }, [waveformData, currentTime, duration, accentColor, dimColor, height]);

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

'use client';

import { useEffect, useRef } from 'react';

interface VUMeterProps {
  level: number; // 0.0 - 1.0
  width?: number;
  height?: number;
}

export default function VUMeter({ level, width = 16, height = 100 }: VUMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animLevelRef = useRef(0);
  const rafRef = useRef<number>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Smooth interpolation toward target
      animLevelRef.current += (level - animLevelRef.current) * 0.15;
      // Add subtle random variation when active
      const noise = level > 0.01 ? (Math.random() - 0.5) * 0.03 : 0;
      const displayLevel = Math.max(0, Math.min(1, animLevelRef.current + noise));

      ctx.clearRect(0, 0, width, height);

      const segments = 20;
      const segHeight = (height - (segments - 1)) / segments;
      const activeSegments = Math.round(displayLevel * segments);

      for (let i = 0; i < segments; i++) {
        const segIndex = segments - 1 - i;
        const y = i * (segHeight + 1);
        const ratio = segIndex / segments;

        if (segIndex < activeSegments) {
          if (ratio > 0.85) ctx.fillStyle = 'var(--vu-red)';
          else if (ratio > 0.7) ctx.fillStyle = 'var(--vu-yellow)';
          else ctx.fillStyle = 'var(--vu-green)';
        } else {
          ctx.fillStyle = 'var(--bg-elevated)';
        }

        ctx.fillRect(0, y, width, segHeight);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [level, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="rounded" />;
}

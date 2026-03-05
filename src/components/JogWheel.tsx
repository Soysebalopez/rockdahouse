'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

interface JogWheelProps {
  isPlaying: boolean;
  currentTime: number;
  onNudge: (seconds: number) => void;
  onScratch: (delta: number) => void;
  accentColor: string;
  size?: number;
}

export default function JogWheel({ isPlaying, currentTime, onNudge, onScratch, accentColor, size = 140 }: JogWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const rafRef = useRef<number>(undefined);
  const isDraggingRef = useRef(false);
  const lastAngleRef = useRef(0);
  const centerRef = useRef({ x: 0, y: 0 });

  // Spinning animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const center = size / 2;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      if (isPlaying && !isDraggingRef.current) {
        rotationRef.current += 0.015; // ~33 RPM feel
      }

      ctx.clearRect(0, 0, size, size);

      // Outer ring
      ctx.beginPath();
      ctx.arc(center, center, center - 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'var(--border-default)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Platter
      ctx.beginPath();
      ctx.arc(center, center, center - 8, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(center, center, 10, center, center, center - 8);
      grad.addColorStop(0, '#1a1a2a');
      grad.addColorStop(0.6, '#111118');
      grad.addColorStop(1, '#0d0d14');
      ctx.fillStyle = grad;
      ctx.fill();

      // Groove lines (vinyl look)
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(rotationRef.current);
      for (let r = 20; r < center - 15; r += 6) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${r < 30 ? 0 : 0.04})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Position marker dot
      ctx.beginPath();
      ctx.arc(0, -(center - 25), 3, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();
      // Glow
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, -(center - 25), 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      // Center label
      ctx.beginPath();
      ctx.arc(center, center, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#1e1e2e';
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, accentColor, size]);

  // Mouse/touch drag handling
  const getAngle = useCallback((clientX: number, clientY: number) => {
    const { x, y } = centerRef.current;
    return Math.atan2(clientY - y, clientX - x);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    lastAngleRef.current = getAngle(e.clientX, e.clientY);
  }, [getAngle]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const angle = getAngle(e.clientX, e.clientY);
    let delta = angle - lastAngleRef.current;

    // Normalize delta to [-PI, PI]
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    rotationRef.current += delta;
    lastAngleRef.current = angle;

    // Convert rotation delta to time nudge (1 full rotation ≈ 2 seconds)
    const timeNudge = (delta / (Math.PI * 2)) * 2;
    onScratch(timeNudge);
  }, [getAngle, onScratch]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, cursor: 'grab', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="flex gap-1">
        <button
          onClick={() => onNudge(-0.5)}
          className="px-2 py-0.5 rounded text-[10px] font-bold"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
        >
          -0.5s
        </button>
        <button
          onClick={() => onNudge(0.5)}
          className="px-2 py-0.5 rounded text-[10px] font-bold"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
        >
          +0.5s
        </button>
      </div>
    </div>
  );
}

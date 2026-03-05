'use client';

import { useRef, useCallback } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  size?: number;
  accentColor?: string;
}

const START_ANGLE = 0.75 * Math.PI; // 135°
const END_ANGLE = 2.25 * Math.PI;   // 405°
const RANGE = END_ANGLE - START_ANGLE;

export default function Knob({ value, min, max, onChange, label, size = 40, accentColor = 'var(--text-primary)' }: KnobProps) {
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const normalized = (value - min) / (max - min); // 0-1
  const angle = START_ANGLE + normalized * RANGE;
  const r = size / 2;
  const trackR = r - 4;

  // Arc path for the value indicator
  const describeArc = (startA: number, endA: number, radius: number) => {
    const x1 = r + radius * Math.cos(startA);
    const y1 = r + radius * Math.sin(startA);
    const x2 = r + radius * Math.cos(endA);
    const y2 = r + radius * Math.sin(endA);
    const largeArc = endA - startA > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Pointer line
  const pointerX = r + (trackR - 6) * Math.cos(angle);
  const pointerY = r + (trackR - 6) * Math.sin(angle);
  const pointerInnerX = r + 8 * Math.cos(angle);
  const pointerInnerY = r + 8 * Math.sin(angle);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startValueRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [value]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = startYRef.current - e.clientY; // Up = increase
    const sensitivity = (max - min) / 100;
    const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
    onChange(newValue);
  }, [min, max, onChange]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Double click to reset to center
  const handleDoubleClick = useCallback(() => {
    const center = (min + max) / 2;
    onChange(center);
  }, [min, max, onChange]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <svg
        width={size}
        height={size}
        style={{ cursor: 'ns-resize', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Background circle */}
        <circle cx={r} cy={r} r={r - 1} fill="var(--knob-bg)" stroke="var(--knob-ring)" strokeWidth={1.5} />

        {/* Track arc (background) */}
        <path
          d={describeArc(START_ANGLE, END_ANGLE, trackR)}
          fill="none"
          stroke="var(--fader-track)"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Value arc */}
        {normalized > 0.01 && (
          <path
            d={describeArc(START_ANGLE, angle, trackR)}
            fill="none"
            stroke={accentColor}
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Center dot */}
        {min < 0 && max > 0 && (
          <circle
            cx={r + trackR * Math.cos(START_ANGLE + 0.5 * RANGE)}
            cy={r + trackR * Math.sin(START_ANGLE + 0.5 * RANGE)}
            r={1.5}
            fill="var(--text-muted)"
          />
        )}

        {/* Pointer line */}
        <line
          x1={pointerInnerX}
          y1={pointerInnerY}
          x2={pointerX}
          y2={pointerY}
          stroke="var(--fader-thumb)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[8px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {value > 0 ? `+${value.toFixed(0)}` : value.toFixed(0)}
      </span>
    </div>
  );
}

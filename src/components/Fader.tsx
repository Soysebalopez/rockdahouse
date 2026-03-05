'use client';

interface FaderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  orientation?: 'vertical' | 'horizontal';
  height?: number;
  width?: number;
  accentColor?: string;
  min?: number;
  max?: number;
  step?: number;
  showCenter?: boolean;
}

export default function Fader({
  value,
  onChange,
  label,
  orientation = 'vertical',
  height = 120,
  width,
  accentColor,
  min = 0,
  max = 1,
  step = 0.01,
  showCenter = false,
}: FaderProps) {
  const isVertical = orientation === 'vertical';

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      )}
      <div className="relative flex items-center justify-center" style={isVertical ? { height } : { width: width || 200 }}>
        {showCenter && isVertical && (
          <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={isVertical ? 'vertical' : ''}
          style={{
            ...(isVertical
              ? { height, width: 28 }
              : { width: width || 200, height: 28 }),
            accentColor: accentColor || 'var(--fader-thumb)',
          }}
        />
      </div>
    </div>
  );
}

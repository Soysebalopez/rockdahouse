'use client';

interface CrossfaderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function Crossfader({ value, onChange }: CrossfaderProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
        CROSSFADER
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: 'var(--accent-a)' }}>A</span>
        <div className="relative" style={{ width: 280 }}>
          {/* Center detent */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-px" style={{ background: 'var(--text-muted)', opacity: 0.3 }} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{ width: 280, height: 28 }}
          />
        </div>
        <span className="text-xs font-bold" style={{ color: 'var(--accent-b)' }}>B</span>
      </div>
    </div>
  );
}

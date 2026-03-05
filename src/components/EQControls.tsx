'use client';

import Knob from './Knob';

interface EQControlsProps {
  eqHigh: number;
  eqMid: number;
  eqLow: number;
  onChangeHigh: (v: number) => void;
  onChangeMid: (v: number) => void;
  onChangeLow: (v: number) => void;
  accentColor: string;
}

export default function EQControls({ eqHigh, eqMid, eqLow, onChangeHigh, onChangeMid, onChangeLow, accentColor }: EQControlsProps) {
  return (
    <div className="flex gap-1 items-start">
      <Knob value={eqHigh} min={-12} max={12} onChange={onChangeHigh} label="HI" size={38} accentColor={accentColor} />
      <Knob value={eqMid} min={-12} max={12} onChange={onChangeMid} label="MD" size={38} accentColor={accentColor} />
      <Knob value={eqLow} min={-12} max={12} onChange={onChangeLow} label="LO" size={38} accentColor={accentColor} />
    </div>
  );
}

'use client';

import Fader from './Fader';

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
    <div className="flex gap-3 items-end">
      <Fader value={eqHigh} onChange={onChangeHigh} label="HI" min={-12} max={12} step={0.5} height={80} accentColor={accentColor} showCenter />
      <Fader value={eqMid} onChange={onChangeMid} label="MD" min={-12} max={12} step={0.5} height={80} accentColor={accentColor} showCenter />
      <Fader value={eqLow} onChange={onChangeLow} label="LO" min={-12} max={12} step={0.5} height={80} accentColor={accentColor} showCenter />
    </div>
  );
}

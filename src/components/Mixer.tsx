'use client';

import Fader from './Fader';
import Crossfader from './Crossfader';
import VUMeter from './VUMeter';

interface MixerProps {
  volumeA: number;
  volumeB: number;
  masterVolume: number;
  crossfaderPosition: number;
  vuLevelA: number;
  vuLevelB: number;
  vuLevelMaster: number;
  onVolumeAChange: (v: number) => void;
  onVolumeBChange: (v: number) => void;
  onMasterVolumeChange: (v: number) => void;
  onCrossfaderChange: (v: number) => void;
}

export default function Mixer({
  volumeA, volumeB, masterVolume, crossfaderPosition,
  vuLevelA, vuLevelB, vuLevelMaster,
  onVolumeAChange, onVolumeBChange, onMasterVolumeChange, onCrossfaderChange,
}: MixerProps) {
  return (
    <div
      className="flex items-end justify-center gap-6 p-4 rounded-xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-end gap-2">
        <VUMeter level={vuLevelA} height={80} />
        <Fader value={volumeA} onChange={onVolumeAChange} label="CH A" height={100} accentColor="var(--accent-a)" />
      </div>

      <Crossfader value={crossfaderPosition} onChange={onCrossfaderChange} />

      <div className="flex items-end gap-2">
        <Fader value={volumeB} onChange={onVolumeBChange} label="CH B" height={100} accentColor="var(--accent-b)" />
        <VUMeter level={vuLevelB} height={80} />
      </div>

      <div className="flex items-end gap-2 ml-4 pl-4" style={{ borderLeft: '1px solid var(--border-default)' }}>
        <VUMeter level={vuLevelMaster} height={80} />
        <Fader value={masterVolume} onChange={onMasterVolumeChange} label="MASTER" height={100} />
      </div>
    </div>
  );
}

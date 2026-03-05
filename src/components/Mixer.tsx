'use client';

import Fader from './Fader';
import Crossfader from './Crossfader';
import VUMeter from './VUMeter';
import type { DeckId } from '@/lib/types';
import type { CrossfaderSide } from '@/stores/useMixerStore';

interface ChannelData {
  id: DeckId;
  volume: number;
  vuLevel: number;
  accentColor: string;
  crossfaderAssign: CrossfaderSide;
  onVolumeChange: (v: number) => void;
  onAssignChange: (side: CrossfaderSide) => void;
}

interface MixerProps {
  channels: ChannelData[];
  masterVolume: number;
  crossfaderPosition: number;
  vuLevelMaster: number;
  onMasterVolumeChange: (v: number) => void;
  onCrossfaderChange: (v: number) => void;
}

function ChannelStrip({ ch }: { ch: ChannelData }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-1.5">
        <VUMeter level={ch.vuLevel} height={80} />
        <Fader
          value={ch.volume}
          onChange={ch.onVolumeChange}
          label={`CH ${ch.id}`}
          height={100}
          accentColor={ch.accentColor}
        />
      </div>
      {/* Crossfader assign toggle */}
      <div className="flex gap-0.5 mt-1">
        <button
          onClick={() => ch.onAssignChange('A')}
          className="px-1.5 py-0.5 rounded text-[9px] font-bold"
          style={{
            background: ch.crossfaderAssign === 'A' ? 'var(--accent-a)' : 'var(--bg-elevated)',
            color: ch.crossfaderAssign === 'A' ? '#fff' : 'var(--text-muted)',
          }}
        >A</button>
        <button
          onClick={() => ch.onAssignChange('B')}
          className="px-1.5 py-0.5 rounded text-[9px] font-bold"
          style={{
            background: ch.crossfaderAssign === 'B' ? 'var(--accent-b)' : 'var(--bg-elevated)',
            color: ch.crossfaderAssign === 'B' ? '#fff' : 'var(--text-muted)',
          }}
        >B</button>
      </div>
    </div>
  );
}

export default function Mixer({
  channels, masterVolume, crossfaderPosition, vuLevelMaster,
  onMasterVolumeChange, onCrossfaderChange,
}: MixerProps) {
  return (
    <div
      className="flex items-end justify-center gap-4 p-4 rounded-xl flex-wrap"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      {channels.map((ch) => (
        <ChannelStrip key={ch.id} ch={ch} />
      ))}

      <Crossfader value={crossfaderPosition} onChange={onCrossfaderChange} />

      <div className="flex items-end gap-2 ml-2 pl-4" style={{ borderLeft: '1px solid var(--border-default)' }}>
        <VUMeter level={vuLevelMaster} height={80} />
        <Fader value={masterVolume} onChange={onMasterVolumeChange} label="MASTER" height={100} />
      </div>
    </div>
  );
}

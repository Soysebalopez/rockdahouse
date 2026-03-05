import { create } from 'zustand';
import type { CrossfaderCurve } from '@/lib/types';

interface MixerState {
  crossfaderPosition: number;
  crossfaderCurve: CrossfaderCurve;
  masterVolume: number;
  vuLevelA: number;
  vuLevelB: number;
  vuLevelMaster: number;
}

interface MixerActions {
  setCrossfaderPosition: (position: number) => void;
  setCrossfaderCurve: (curve: CrossfaderCurve) => void;
  setMasterVolume: (volume: number) => void;
  setVuLevelA: (level: number) => void;
  setVuLevelB: (level: number) => void;
  setVuLevelMaster: (level: number) => void;
}

export const useMixerStore = create<MixerState & MixerActions>((set) => ({
  crossfaderPosition: 0.5,
  crossfaderCurve: 'equalPower',
  masterVolume: 0.8,
  vuLevelA: 0,
  vuLevelB: 0,
  vuLevelMaster: 0,

  setCrossfaderPosition: (position) => set({ crossfaderPosition: position }),
  setCrossfaderCurve: (curve) => set({ crossfaderCurve: curve }),
  setMasterVolume: (volume) => set({ masterVolume: volume }),
  setVuLevelA: (level) => set({ vuLevelA: level }),
  setVuLevelB: (level) => set({ vuLevelB: level }),
  setVuLevelMaster: (level) => set({ vuLevelMaster: level }),
}));

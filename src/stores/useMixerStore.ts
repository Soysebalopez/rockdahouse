import { create } from 'zustand';
import type { CrossfaderCurve, DeckId } from '@/lib/types';

// Crossfader assign: which side of the crossfader each deck is routed to
export type CrossfaderSide = 'A' | 'B';

interface MixerState {
  crossfaderPosition: number;
  crossfaderCurve: CrossfaderCurve;
  masterVolume: number;
  deckMode: 2 | 4;
  // VU levels per deck + master
  vuLevels: Record<DeckId, number>;
  vuLevelMaster: number;
  // Crossfader assign per deck (which side of crossfader)
  crossfaderAssign: Record<DeckId, CrossfaderSide>;
}

interface MixerActions {
  setCrossfaderPosition: (position: number) => void;
  setCrossfaderCurve: (curve: CrossfaderCurve) => void;
  setMasterVolume: (volume: number) => void;
  setDeckMode: (mode: 2 | 4) => void;
  setVuLevel: (deck: DeckId, level: number) => void;
  setVuLevelMaster: (level: number) => void;
  setCrossfaderAssign: (deck: DeckId, side: CrossfaderSide) => void;
  // Legacy accessors for backward compat
  setVuLevelA: (level: number) => void;
  setVuLevelB: (level: number) => void;
}

export const useMixerStore = create<MixerState & MixerActions>((set) => ({
  crossfaderPosition: 0.5,
  crossfaderCurve: 'equalPower',
  masterVolume: 0.8,
  deckMode: 2,
  vuLevels: { A: 0, B: 0, C: 0, D: 0 },
  vuLevelMaster: 0,
  crossfaderAssign: { A: 'A', B: 'B', C: 'A', D: 'B' },

  setCrossfaderPosition: (position) => set({ crossfaderPosition: position }),
  setCrossfaderCurve: (curve) => set({ crossfaderCurve: curve }),
  setMasterVolume: (volume) => set({ masterVolume: volume }),
  setDeckMode: (mode) => set({ deckMode: mode }),
  setVuLevel: (deck, level) => set((s) => ({ vuLevels: { ...s.vuLevels, [deck]: level } })),
  setVuLevelMaster: (level) => set({ vuLevelMaster: level }),
  setCrossfaderAssign: (deck, side) => set((s) => ({ crossfaderAssign: { ...s.crossfaderAssign, [deck]: side } })),
  // Legacy
  setVuLevelA: (level) => set((s) => ({ vuLevels: { ...s.vuLevels, A: level } })),
  setVuLevelB: (level) => set((s) => ({ vuLevels: { ...s.vuLevels, B: level } })),
}));

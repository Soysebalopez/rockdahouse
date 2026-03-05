import { create } from 'zustand';
import type { DeckId, Track } from '@/lib/types';

interface DeckState {
  videoId: string | null;
  title: string;
  channel: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  bpm: number | null;
  playerRef: YT.Player | null;
}

interface DeckActions {
  loadTrack: (track: Track) => void;
  setPlayerRef: (player: YT.Player | null) => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setEQ: (band: 'low' | 'mid' | 'high', gain: number) => void;
  setBPM: (bpm: number | null) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
}

const defaultDeckState: DeckState = {
  videoId: null,
  title: '',
  channel: '',
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  volume: 0.8,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
  bpm: null,
  playerRef: null,
};

function createDeckStore() {
  return create<DeckState & DeckActions>((set) => ({
    ...defaultDeckState,
    loadTrack: (track) => set({
      videoId: track.videoId,
      title: track.title,
      channel: track.channel,
      isPlaying: false,
      currentTime: 0,
    }),
    setPlayerRef: (player) => set({ playerRef: player }),
    setPlaying: (playing) => set({ isPlaying: playing }),
    setVolume: (volume) => set({ volume }),
    setEQ: (band, gain) => {
      switch (band) {
        case 'low': return set({ eqLow: gain });
        case 'mid': return set({ eqMid: gain });
        case 'high': return set({ eqHigh: gain });
      }
    },
    setBPM: (bpm) => set({ bpm }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration }),
  }));
}

export const useDeckAStore = createDeckStore();
export const useDeckBStore = createDeckStore();

export function useDeckStore(id: DeckId) {
  return id === 'A' ? useDeckAStore : useDeckBStore;
}

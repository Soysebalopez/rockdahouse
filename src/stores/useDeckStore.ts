import { create } from 'zustand';
import type { DeckId, Track } from '@/lib/types';

export interface HotCue {
  time: number;
  label: string;
  color: string;
}

interface LoopState {
  active: boolean;
  start: number;
  end: number;
  beats: number | null; // 4, 8, 16 or null for manual
}

// 8-band EQ: each band is a gain value from -12 to +12 dB
export const EQ_BANDS = ['32', '64', '125', '250', '500', '1K', '2K', '4K'] as const;
export type EQBandLabel = typeof EQ_BANDS[number];

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
  eqBands: number[]; // 8-band gains (-12 to +12)
  eqPanelOpen: boolean;
  bpm: number | null;
  playerRef: YT.Player | null;
  // Audio engine state
  audioEngineActive: boolean;
  audioStreamUrl: string | null;
  audioError: string | null;
  // Loop
  loop: LoopState;
  // Hot cues
  hotCues: (HotCue | null)[];
}

interface DeckActions {
  loadTrack: (track: Track) => void;
  setPlayerRef: (player: YT.Player | null) => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setEQ: (band: 'low' | 'mid' | 'high', gain: number) => void;
  setEQBand: (index: number, gain: number) => void;
  resetEQBands: () => void;
  toggleEQPanel: () => void;
  setBPM: (bpm: number | null) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  // Audio engine
  setAudioEngineActive: (active: boolean) => void;
  setAudioStreamUrl: (url: string | null) => void;
  setAudioError: (error: string | null) => void;
  fetchAudioStream: (videoId: string) => void;
  // Loop
  setLoop: (loop: LoopState) => void;
  clearLoop: () => void;
  // Hot cues
  setHotCue: (index: number, cue: HotCue | null) => void;
}

const defaultLoop: LoopState = { active: false, start: 0, end: 0, beats: null };

const defaultEQBands = [0, 0, 0, 0, 0, 0, 0, 0];

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
  eqBands: [...defaultEQBands],
  eqPanelOpen: false,
  bpm: null,
  playerRef: null,
  audioEngineActive: false,
  audioStreamUrl: null,
  audioError: null,
  loop: { ...defaultLoop },
  hotCues: [null, null, null],
};

function createDeckStore() {
  return create<DeckState & DeckActions>((set) => ({
    ...defaultDeckState,
    loadTrack: (track) => {
      set({
        videoId: track.videoId,
        title: track.title,
        channel: track.channel,
        isPlaying: false,
        currentTime: 0,
        loop: { ...defaultLoop },
        hotCues: [null, null, null],
        audioEngineActive: false,
        audioStreamUrl: null,
        audioError: null,
      });
    },
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
    setEQBand: (index, gain) => set((s) => {
      const eqBands = [...s.eqBands];
      eqBands[index] = gain;
      return { eqBands };
    }),
    resetEQBands: () => set({ eqBands: [...defaultEQBands] }),
    toggleEQPanel: () => set((s) => ({ eqPanelOpen: !s.eqPanelOpen })),
    setAudioEngineActive: (active) => set({ audioEngineActive: active }),
    setAudioStreamUrl: (url) => set({ audioStreamUrl: url }),
    setAudioError: (error) => set({ audioError: error }),
    fetchAudioStream: (videoId) => {
      fetch(`/api/stream?videoId=${videoId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Stream fetch failed');
          return res.json();
        })
        .then((data) => {
          if (data.url) {
            set({ audioStreamUrl: `/api/audio-proxy?videoId=${videoId}` });
          } else {
            set({ audioError: 'No audio URL', audioStreamUrl: null });
          }
        })
        .catch((err) => {
          set({ audioError: err.message, audioStreamUrl: null });
        });
    },
    setBPM: (bpm) => set({ bpm }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration }),
    setLoop: (loop) => set({ loop }),
    clearLoop: () => set({ loop: { ...defaultLoop } }),
    setHotCue: (index, cue) => set((s) => {
      const hotCues = [...s.hotCues];
      hotCues[index] = cue;
      return { hotCues };
    }),
  }));
}

export const useDeckAStore = createDeckStore();
export const useDeckBStore = createDeckStore();
export const useDeckCStore = createDeckStore();
export const useDeckDStore = createDeckStore();

const DECK_STORES = {
  A: useDeckAStore,
  B: useDeckBStore,
  C: useDeckCStore,
  D: useDeckDStore,
} as const;

export function useDeckStore(id: DeckId) {
  return DECK_STORES[id];
}

export function getDeckStoreById(id: DeckId) {
  return DECK_STORES[id];
}

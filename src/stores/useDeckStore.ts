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

interface DeckState {
  videoId: string | null;
  title: string;
  channel: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  bpm: number | null;
  playbackRate: number;
  syncLocked: boolean;
  playerRef: YT.Player | null;
  // Audio routing
  audioUrl: string | null;
  audioReady: boolean;
  useDirectAudio: boolean;
  // Pitch
  pitchRange: 8 | 16;
  pitchValue: number; // -1 to +1 normalized
  scratchMode: boolean; // true = scratch (seek), false = pitch bend (rate)
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
  setBPM: (bpm: number | null) => void;
  setPlaybackRate: (rate: number) => void;
  setSyncLocked: (locked: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  // Audio routing
  setAudioUrl: (url: string | null) => void;
  setAudioReady: (ready: boolean) => void;
  setUseDirectAudio: (use: boolean) => void;
  // Pitch
  setPitchRange: (range: 8 | 16) => void;
  setPitchValue: (value: number) => void;
  setScratchMode: (mode: boolean) => void;
  // Loop
  setLoop: (loop: LoopState) => void;
  clearLoop: () => void;
  // Hot cues
  setHotCue: (index: number, cue: HotCue | null) => void;
}

const defaultLoop: LoopState = { active: false, start: 0, end: 0, beats: null };

const defaultDeckState: DeckState = {
  videoId: null,
  title: '',
  channel: '',
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  volume: 0.8,
  bpm: null,
  playbackRate: 1,
  syncLocked: false,
  playerRef: null,
  audioUrl: null,
  audioReady: false,
  useDirectAudio: false,
  pitchRange: 8,
  pitchValue: 0,
  scratchMode: true,
  loop: { ...defaultLoop },
  hotCues: [null, null, null],
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
      playbackRate: 1,
      syncLocked: false,
      pitchValue: 0,
      audioUrl: null,
      audioReady: false,
      useDirectAudio: false,
      loop: { ...defaultLoop },
      hotCues: [null, null, null],
    }),
    setPlayerRef: (player) => set({ playerRef: player }),
    setPlaying: (playing) => set({ isPlaying: playing }),
    setVolume: (volume) => set({ volume }),
    setBPM: (bpm) => set({ bpm }),
    setPlaybackRate: (rate) => set((s) => {
      s.playerRef?.setPlaybackRate(rate);
      return { playbackRate: rate };
    }),
    setSyncLocked: (locked) => set({ syncLocked: locked }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (duration) => set({ duration }),
    setAudioUrl: (url) => set({ audioUrl: url }),
    setAudioReady: (ready) => set({ audioReady: ready }),
    setUseDirectAudio: (use) => set({ useDirectAudio: use }),
    setPitchRange: (range) => set({ pitchRange: range }),
    setPitchValue: (value) => set((s) => {
      const clamped = Math.max(-1, Math.min(1, value));
      const rate = 1 + clamped * (s.pitchRange / 100);
      s.playerRef?.setPlaybackRate(Math.max(0.5, Math.min(2, rate)));
      return { pitchValue: clamped };
    }),
    setScratchMode: (mode) => set({ scratchMode: mode }),
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

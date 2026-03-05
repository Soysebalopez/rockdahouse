import { create } from 'zustand';
import type { DeckId } from '@/lib/types';
import { getDeckStoreById } from './useDeckStore';

export type EffectType = 'brake' | 'spinback' | 'beatRepeat' | 'echoOut' | 'filterSweep';

interface DeckEffect {
  active: EffectType | null;
  progress: number; // 0-1
}

interface EffectsState {
  decks: Record<DeckId, DeckEffect>;
}

interface EffectsActions {
  startEffect: (deckId: DeckId, effect: EffectType) => void;
  stopEffect: (deckId: DeckId) => void;
  setProgress: (deckId: DeckId, progress: number) => void;
}

const defaultDeckEffect: DeckEffect = { active: null, progress: 0 };

// Store interval/timeout refs outside Zustand to avoid serialization issues
const effectTimers: Record<DeckId, ReturnType<typeof setInterval> | undefined> = {
  A: undefined, B: undefined, C: undefined, D: undefined,
};

function clearEffectTimer(deckId: DeckId) {
  if (effectTimers[deckId]) {
    clearInterval(effectTimers[deckId]);
    effectTimers[deckId] = undefined;
  }
}

export const useEffectsStore = create<EffectsState & EffectsActions>((set, get) => ({
  decks: {
    A: { ...defaultDeckEffect },
    B: { ...defaultDeckEffect },
    C: { ...defaultDeckEffect },
    D: { ...defaultDeckEffect },
  },

  setProgress: (deckId, progress) =>
    set((s) => ({
      decks: { ...s.decks, [deckId]: { ...s.decks[deckId], progress } },
    })),

  stopEffect: (deckId) => {
    clearEffectTimer(deckId);
    // Restore playback rate to 1
    const player = getDeckStoreById(deckId).getState().playerRef;
    player?.setPlaybackRate(1);
    set((s) => ({
      decks: { ...s.decks, [deckId]: { active: null, progress: 0 } },
    }));
  },

  startEffect: (deckId, effect) => {
    const state = get();
    // If same effect is active, toggle off
    if (state.decks[deckId].active === effect) {
      state.stopEffect(deckId);
      return;
    }
    // Stop any existing effect first
    if (state.decks[deckId].active) {
      state.stopEffect(deckId);
    }

    set((s) => ({
      decks: { ...s.decks, [deckId]: { active: effect, progress: 0 } },
    }));

    const deckStore = getDeckStoreById(deckId);
    const player = deckStore.getState().playerRef;
    if (!player) return;

    switch (effect) {
      case 'brake':
        runBrake(deckId, player, set, get);
        break;
      case 'spinback':
        runSpinback(deckId, player, set, get);
        break;
      case 'beatRepeat':
        runBeatRepeat(deckId, player, set, get);
        break;
      case 'echoOut':
        runEchoOut(deckId, player, set, get);
        break;
      case 'filterSweep':
        runFilterSweep(deckId, player, set, get);
        break;
    }
  },
}));

type SetFn = (fn: (s: EffectsState & EffectsActions) => Partial<EffectsState & EffectsActions>) => void;
type GetFn = () => EffectsState & EffectsActions;

function runBrake(deckId: DeckId, player: YT.Player, set: SetFn, get: GetFn) {
  const startRate = player.getPlaybackRate?.() ?? 1;
  const steps = 20;
  const intervalMs = 80; // ~1.6s total
  let step = 0;

  effectTimers[deckId] = setInterval(() => {
    step++;
    const progress = step / steps;
    const rate = Math.max(0.25, startRate * (1 - progress * 0.75));
    player.setPlaybackRate(rate);
    get().setProgress(deckId, progress);

    if (step >= steps) {
      clearEffectTimer(deckId);
      player.pauseVideo();
      player.setPlaybackRate(1);
      set((s) => ({
        decks: { ...s.decks, [deckId]: { active: null, progress: 0 } },
      }));
    }
  }, intervalMs);
}

function runSpinback(deckId: DeckId, player: YT.Player, set: SetFn, get: GetFn) {
  const steps = 15;
  const intervalMs = 60; // ~0.9s total
  let step = 0;
  const startTime = player.getCurrentTime?.() ?? 0;

  effectTimers[deckId] = setInterval(() => {
    step++;
    const progress = step / steps;
    // Seek backwards with increasing jumps
    const seekBack = progress * progress * 4; // quadratic curve, up to 4 seconds back
    const newTime = Math.max(0, startTime - seekBack);
    player.seekTo(newTime, true);
    get().setProgress(deckId, progress);

    if (step >= steps) {
      clearEffectTimer(deckId);
      player.pauseVideo();
      player.setPlaybackRate(1);
      set((s) => ({
        decks: { ...s.decks, [deckId]: { active: null, progress: 0 } },
      }));
    }
  }, intervalMs);
}

function runBeatRepeat(deckId: DeckId, player: YT.Player, set: SetFn, get: GetFn) {
  const deckState = getDeckStoreById(deckId).getState();
  const bpm = deckState.bpm ?? 120;
  const beatDuration = 60 / bpm;
  // Start with 1/4 beat, progressively tighter
  const divisions = [4, 8, 8, 16, 16, 16, 16, 16];
  let step = 0;
  const anchorTime = player.getCurrentTime?.() ?? 0;
  const totalSteps = divisions.length;

  effectTimers[deckId] = setInterval(() => {
    if (get().decks[deckId].active !== 'beatRepeat') return;

    const division = divisions[Math.min(step, divisions.length - 1)];
    const sliceDuration = beatDuration / (division / 4);

    player.seekTo(anchorTime, true);
    get().setProgress(deckId, step / totalSteps);
    step++;

    if (step >= totalSteps) {
      step = 0; // Loop forever until cancelled
    }
  }, (beatDuration / 2) * 1000); // Re-trigger at 1/2 beat intervals
}

function runEchoOut(deckId: DeckId, player: YT.Player, set: SetFn, get: GetFn) {
  const startVolume = player.getVolume?.() ?? 100;
  const steps = 25;
  const intervalMs = 80; // ~2s total
  let step = 0;

  effectTimers[deckId] = setInterval(() => {
    step++;
    const progress = step / steps;
    const vol = Math.max(0, startVolume * (1 - progress));
    player.setVolume(vol);
    get().setProgress(deckId, progress);

    if (step >= steps) {
      clearEffectTimer(deckId);
      player.pauseVideo();
      // Volume will be restored by Console.tsx rAF loop when playing resumes
      set((s) => ({
        decks: { ...s.decks, [deckId]: { active: null, progress: 0 } },
      }));
    }
  }, intervalMs);
}

function runFilterSweep(deckId: DeckId, player: YT.Player, set: SetFn, get: GetFn) {
  // Visual-only with slight volume ducking to simulate filter
  const startVolume = player.getVolume?.() ?? 100;
  const steps = 40;
  const intervalMs = 50; // ~2s sweep
  let step = 0;
  let direction = 1; // 1 = sweeping in, -1 = sweeping out

  effectTimers[deckId] = setInterval(() => {
    if (get().decks[deckId].active !== 'filterSweep') return;

    step += direction;
    const progress = step / steps;

    // Slight volume ducking at midpoint of sweep
    const duck = 1 - Math.sin(progress * Math.PI) * 0.15;
    player.setVolume(startVolume * duck);
    get().setProgress(deckId, Math.abs(progress));

    if (step >= steps) direction = -1;
    if (step <= 0) direction = 1;
  }, intervalMs);
}

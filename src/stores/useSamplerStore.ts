import { create } from 'zustand';
import { DEFAULT_SAMPLES } from '@/lib/samples';
import { useAudioConfigStore } from './useAudioConfigStore';

export interface Pad {
  name: string;
  color: string;
  buffer: AudioBuffer | null;
  isCustom: boolean;
  isLoop: boolean;
  isPlaying: boolean;
}

interface SamplerState {
  isOpen: boolean;
  volume: number;
  pads: Pad[];
  audioCtx: AudioContext | null;
  masterGain: GainNode | null;
}

interface SamplerActions {
  toggle: () => void;
  setVolume: (vol: number) => void;
  init: () => void;
  triggerPad: (index: number) => void;
  stopPad: (index: number) => void;
  loadCustomSample: (index: number, file: File) => void;
  togglePadLoop: (index: number) => void;
  routeToDevice: (deviceId: string) => void;
}

// Track active source nodes outside Zustand
const activeSources: (AudioBufferSourceNode | null)[] = Array(16).fill(null);

export const useSamplerStore = create<SamplerState & SamplerActions>((set, get) => ({
  isOpen: false,
  volume: 0.8,
  pads: DEFAULT_SAMPLES.map((s) => ({
    name: s.name,
    color: s.color,
    buffer: null,
    isCustom: false,
    isLoop: false,
    isPlaying: false,
  })),
  audioCtx: null,
  masterGain: null,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  setVolume: (vol) => {
    const { masterGain } = get();
    if (masterGain) masterGain.gain.value = vol;
    set({ volume: vol });
  },

  init: () => {
    const state = get();
    if (state.audioCtx) return; // Already initialized

    const audioCtx = new AudioContext();
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = state.volume;
    masterGain.connect(audioCtx.destination);

    // Route to configured device if setSinkId is available
    const deviceId = useAudioConfigStore.getState().masterDeviceId;
    if (deviceId && deviceId !== 'default' && 'setSinkId' in audioCtx) {
      (audioCtx as any).setSinkId(deviceId).catch(() => { /* fallback to default */ });
    }

    // Generate default sample buffers
    const pads = state.pads.map((pad, i) => ({
      ...pad,
      buffer: DEFAULT_SAMPLES[i].generate(audioCtx),
    }));

    set({ audioCtx, masterGain, pads });
  },

  triggerPad: (index) => {
    const state = get();
    if (!state.audioCtx || !state.masterGain) {
      // Auto-init on first trigger
      get().init();
      // Re-read state after init
      const s2 = get();
      if (!s2.audioCtx || !s2.masterGain) return;
      triggerPadInternal(s2, index, set);
      return;
    }
    triggerPadInternal(state, index, set);
  },

  stopPad: (index) => {
    if (activeSources[index]) {
      try { activeSources[index]!.stop(); } catch { /* already stopped */ }
      activeSources[index] = null;
    }
    set((s) => {
      const pads = [...s.pads];
      pads[index] = { ...pads[index], isPlaying: false };
      return { pads };
    });
  },

  loadCustomSample: async (index, file) => {
    let state = get();
    if (!state.audioCtx) {
      state.init();
      state = get();
    }
    if (!state.audioCtx) return;

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await state.audioCtx.decodeAudioData(arrayBuffer);

    set((s) => {
      const pads = [...s.pads];
      pads[index] = {
        ...pads[index],
        buffer: audioBuffer,
        name: file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 6),
        isCustom: true,
      };
      return { pads };
    });
  },

  togglePadLoop: (index) =>
    set((s) => {
      const pads = [...s.pads];
      pads[index] = { ...pads[index], isLoop: !pads[index].isLoop };
      return { pads };
    }),

  routeToDevice: (deviceId) => {
    const { audioCtx } = get();
    if (audioCtx && 'setSinkId' in audioCtx) {
      (audioCtx as any).setSinkId(deviceId).catch(() => { /* unsupported or failed */ });
    }
  },
}));

function triggerPadInternal(
  state: SamplerState & SamplerActions,
  index: number,
  set: (fn: (s: SamplerState & SamplerActions) => Partial<SamplerState & SamplerActions>) => void,
) {
  const pad = state.pads[index];
  if (!pad.buffer || !state.audioCtx || !state.masterGain) return;

  // Stop existing source for this pad
  if (activeSources[index]) {
    try { activeSources[index]!.stop(); } catch { /* already stopped */ }
  }

  const source = state.audioCtx.createBufferSource();
  source.buffer = pad.buffer;
  source.loop = pad.isLoop;

  const padGain = state.audioCtx.createGain();
  padGain.gain.value = 1;
  source.connect(padGain);
  padGain.connect(state.masterGain);

  source.onended = () => {
    activeSources[index] = null;
    set((s) => {
      const pads = [...s.pads];
      pads[index] = { ...pads[index], isPlaying: false };
      return { pads };
    });
  };

  source.start(0);
  activeSources[index] = source;

  set((s) => {
    const pads = [...s.pads];
    pads[index] = { ...pads[index], isPlaying: true };
    return { pads };
  });
}

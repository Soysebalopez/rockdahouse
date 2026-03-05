import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MidiAction =
  | 'deckA.play' | 'deckA.cue' | 'deckA.volume' | 'deckA.eqHigh' | 'deckA.eqMid' | 'deckA.eqLow'
  | 'deckA.loop4' | 'deckA.loop8' | 'deckA.loop16' | 'deckA.hotcue1' | 'deckA.hotcue2' | 'deckA.hotcue3'
  | 'deckA.fxBrake' | 'deckA.fxSpin' | 'deckA.fxRepeat' | 'deckA.fxEcho' | 'deckA.fxFilter'
  | 'deckB.play' | 'deckB.cue' | 'deckB.volume' | 'deckB.eqHigh' | 'deckB.eqMid' | 'deckB.eqLow'
  | 'deckB.loop4' | 'deckB.loop8' | 'deckB.loop16' | 'deckB.hotcue1' | 'deckB.hotcue2' | 'deckB.hotcue3'
  | 'deckB.fxBrake' | 'deckB.fxSpin' | 'deckB.fxRepeat' | 'deckB.fxEcho' | 'deckB.fxFilter'
  | 'deckC.play' | 'deckC.cue' | 'deckC.volume' | 'deckC.eqHigh' | 'deckC.eqMid' | 'deckC.eqLow'
  | 'deckC.fxBrake' | 'deckC.fxSpin' | 'deckC.fxRepeat' | 'deckC.fxEcho' | 'deckC.fxFilter'
  | 'deckD.play' | 'deckD.cue' | 'deckD.volume' | 'deckD.eqHigh' | 'deckD.eqMid' | 'deckD.eqLow'
  | 'deckD.fxBrake' | 'deckD.fxSpin' | 'deckD.fxRepeat' | 'deckD.fxEcho' | 'deckD.fxFilter'
  | 'sampler.pad1' | 'sampler.pad2' | 'sampler.pad3' | 'sampler.pad4'
  | 'sampler.pad5' | 'sampler.pad6' | 'sampler.pad7' | 'sampler.pad8'
  | 'crossfader' | 'masterVolume';

export interface MidiMapping {
  channel: number;
  note: number; // CC number or note number
  type: 'cc' | 'note';
  action: MidiAction;
}

interface MidiState {
  connected: boolean;
  deviceName: string | null;
  mappings: MidiMapping[];
  learnTarget: MidiAction | null;
  lastMessage: { channel: number; type: string; note: number; value: number } | null;
}

interface MidiActions {
  setConnected: (connected: boolean, deviceName?: string) => void;
  setMapping: (mapping: MidiMapping) => void;
  removeMapping: (action: MidiAction) => void;
  setLearnTarget: (target: MidiAction | null) => void;
  setLastMessage: (msg: MidiState['lastMessage']) => void;
  clearMappings: () => void;
}

// Default mappings for common DJ controllers (Pioneer DDJ-style)
const DEFAULT_MAPPINGS: MidiMapping[] = [
  // These are generic — user can remap via MIDI learn
  { channel: 0, note: 0x11, type: 'note', action: 'deckA.play' },
  { channel: 0, note: 0x12, type: 'note', action: 'deckA.cue' },
  { channel: 1, note: 0x11, type: 'note', action: 'deckB.play' },
  { channel: 1, note: 0x12, type: 'note', action: 'deckB.cue' },
  { channel: 0, note: 0x13, type: 'cc', action: 'deckA.volume' },
  { channel: 1, note: 0x13, type: 'cc', action: 'deckB.volume' },
  { channel: 0, note: 0x17, type: 'cc', action: 'crossfader' },
];

export const useMidiStore = create<MidiState & MidiActions>()(
  persist(
    (set, get) => ({
      connected: false,
      deviceName: null,
      mappings: DEFAULT_MAPPINGS,
      learnTarget: null,
      lastMessage: null,

      setConnected: (connected, deviceName) => set({ connected, deviceName: deviceName ?? null }),
      setMapping: (mapping) => set((s) => ({
        mappings: [
          ...s.mappings.filter((m) => m.action !== mapping.action),
          mapping,
        ],
        learnTarget: null,
      })),
      removeMapping: (action) => set((s) => ({
        mappings: s.mappings.filter((m) => m.action !== action),
      })),
      setLearnTarget: (target) => set({ learnTarget: target }),
      setLastMessage: (msg) => {
        const state = get();
        // If in learn mode, map this message to the learn target
        if (state.learnTarget && msg) {
          set({
            mappings: [
              ...state.mappings.filter((m) => m.action !== state.learnTarget),
              {
                channel: msg.channel,
                note: msg.note,
                type: msg.type === 'cc' ? 'cc' : 'note',
                action: state.learnTarget!,
              },
            ],
            learnTarget: null,
            lastMessage: msg,
          });
        } else {
          set({ lastMessage: msg });
        }
      },
      clearMappings: () => set({ mappings: [] }),
    }),
    {
      name: 'rockdahouse-midi',
      partialize: (state) => ({ mappings: state.mappings }),
    }
  )
);

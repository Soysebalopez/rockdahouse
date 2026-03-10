import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// All mappable deck actions
type DeckPrefix = 'deckA' | 'deckB' | 'deckC' | 'deckD';
type DeckControl =
  | 'play' | 'cue' | 'volume' | 'pitch' | 'sync'
  | 'listen' | 'load' | 'scratchMode'
  | 'hotcue1' | 'hotcue2' | 'hotcue3'
  | 'loop4' | 'loop8' | 'loop16'
  | 'fxBrake' | 'fxSpin' | 'fxRepeat' | 'fxEcho' | 'fxFilter';

export type MidiAction =
  | `${DeckPrefix}.${DeckControl}`
  | 'sampler.pad1' | 'sampler.pad2' | 'sampler.pad3' | 'sampler.pad4'
  | 'sampler.pad5' | 'sampler.pad6' | 'sampler.pad7' | 'sampler.pad8'
  | 'crossfader' | 'masterVolume';

export interface MidiMapping {
  channel: number;
  note: number; // CC number or note number
  type: 'cc' | 'note';
  action: MidiAction;
}

export interface MidiPreset {
  name: string;
  deviceMatch: string[]; // Substrings to match against MIDIInput.name
  mappings: MidiMapping[];
}

interface MidiState {
  connected: boolean;
  deviceName: string | null;
  mappings: MidiMapping[];
  learnTarget: MidiAction | null;
  lastMessage: { channel: number; type: string; note: number; value: number } | null;
  activePreset: string | null;
}

interface MidiActions {
  setConnected: (connected: boolean, deviceName?: string) => void;
  setMapping: (mapping: MidiMapping) => void;
  removeMapping: (action: MidiAction) => void;
  setLearnTarget: (target: MidiAction | null) => void;
  setLastMessage: (msg: MidiState['lastMessage']) => void;
  clearMappings: () => void;
  loadPreset: (preset: MidiPreset) => void;
  autoDetectPreset: (deviceName: string) => void;
}

// ─────────────────────────────────────────────
// Controller Presets
// ─────────────────────────────────────────────

const HERCULES_MP3_E2: MidiPreset = {
  name: 'Hercules DJ Control MP3 e2',
  deviceMatch: ['MP3 e2', 'DJControl MP3', 'MP3 LE', 'Glow'],
  mappings: [
    // ── Deck A (Channel 0) ──
    { channel: 0, note: 0x0F, type: 'note', action: 'deckA.play' },
    { channel: 0, note: 0x0E, type: 'note', action: 'deckA.cue' },
    { channel: 0, note: 0x12, type: 'note', action: 'deckA.sync' },
    { channel: 0, note: 0x10, type: 'note', action: 'deckA.listen' },
    { channel: 0, note: 0x11, type: 'note', action: 'deckA.load' },
    { channel: 0, note: 0x2D, type: 'note', action: 'deckA.scratchMode' },
    { channel: 0, note: 0x34, type: 'cc', action: 'deckA.volume' },
    { channel: 0, note: 0x32, type: 'cc', action: 'deckA.pitch' },
    // Key buttons 1-8 → hot cues + loops + FX
    { channel: 0, note: 0x01, type: 'note', action: 'deckA.hotcue1' },
    { channel: 0, note: 0x02, type: 'note', action: 'deckA.hotcue2' },
    { channel: 0, note: 0x03, type: 'note', action: 'deckA.hotcue3' },
    { channel: 0, note: 0x04, type: 'note', action: 'deckA.loop4' },
    { channel: 0, note: 0x05, type: 'note', action: 'deckA.loop8' },
    { channel: 0, note: 0x06, type: 'note', action: 'deckA.fxBrake' },
    { channel: 0, note: 0x07, type: 'note', action: 'deckA.fxSpin' },
    { channel: 0, note: 0x08, type: 'note', action: 'deckA.fxEcho' },

    // ── Deck B (Channel 0, higher note range) ──
    { channel: 0, note: 0x23, type: 'note', action: 'deckB.play' },
    { channel: 0, note: 0x22, type: 'note', action: 'deckB.cue' },
    { channel: 0, note: 0x26, type: 'note', action: 'deckB.sync' },
    { channel: 0, note: 0x24, type: 'note', action: 'deckB.listen' },
    { channel: 0, note: 0x25, type: 'note', action: 'deckB.load' },
    { channel: 0, note: 0x39, type: 'cc', action: 'deckB.volume' },
    { channel: 0, note: 0x33, type: 'cc', action: 'deckB.pitch' },
    // Key buttons 1-8 (Deck B range)
    { channel: 0, note: 0x15, type: 'note', action: 'deckB.hotcue1' },
    { channel: 0, note: 0x16, type: 'note', action: 'deckB.hotcue2' },
    { channel: 0, note: 0x17, type: 'note', action: 'deckB.hotcue3' },
    { channel: 0, note: 0x18, type: 'note', action: 'deckB.loop4' },
    { channel: 0, note: 0x19, type: 'note', action: 'deckB.loop8' },
    { channel: 0, note: 0x1A, type: 'note', action: 'deckB.fxBrake' },
    { channel: 0, note: 0x1B, type: 'note', action: 'deckB.fxSpin' },
    { channel: 0, note: 0x1C, type: 'note', action: 'deckB.fxEcho' },

    // ── Master ──
    { channel: 0, note: 0x38, type: 'cc', action: 'crossfader' },
  ],
};

// Generic 2-channel preset for controllers that use ch0 for deck A, ch1 for deck B
const GENERIC_2CH: MidiPreset = {
  name: 'Generic 2-Channel',
  deviceMatch: [], // Never auto-loaded, user selects manually
  mappings: [
    { channel: 0, note: 0x11, type: 'note', action: 'deckA.play' },
    { channel: 0, note: 0x12, type: 'note', action: 'deckA.cue' },
    { channel: 0, note: 0x13, type: 'cc', action: 'deckA.volume' },
    { channel: 1, note: 0x11, type: 'note', action: 'deckB.play' },
    { channel: 1, note: 0x12, type: 'note', action: 'deckB.cue' },
    { channel: 1, note: 0x13, type: 'cc', action: 'deckB.volume' },
    { channel: 0, note: 0x17, type: 'cc', action: 'crossfader' },
  ],
};

export const MIDI_PRESETS: MidiPreset[] = [
  HERCULES_MP3_E2,
  GENERIC_2CH,
];

// ─────────────────────────────────────────────

export const useMidiStore = create<MidiState & MidiActions>()(
  persist(
    (set, get) => ({
      connected: false,
      deviceName: null,
      mappings: [],
      learnTarget: null,
      lastMessage: null,
      activePreset: null,

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
      clearMappings: () => set({ mappings: [], activePreset: null }),

      loadPreset: (preset) => set({
        mappings: [...preset.mappings],
        activePreset: preset.name,
      }),

      autoDetectPreset: (deviceName) => {
        const state = get();
        // Don't auto-load if user already has mappings (they may have customized)
        if (state.mappings.length > 0) return;

        for (const preset of MIDI_PRESETS) {
          if (preset.deviceMatch.some((match) => deviceName.includes(match))) {
            set({
              mappings: [...preset.mappings],
              activePreset: preset.name,
            });
            return;
          }
        }
      },
    }),
    {
      name: 'rockdahouse-midi',
      partialize: (state) => ({ mappings: state.mappings, activePreset: state.activePreset }),
    }
  )
);

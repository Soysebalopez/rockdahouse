import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OutputMode = 'speakers' | 'speakersHeadphones' | 'separateDecks';
export type ChannelMode = 'stereo' | 'monoL' | 'monoR';

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface AudioConfigState {
  outputMode: OutputMode;
  masterDeviceId: string;
  headphoneDeviceId: string;
  masterChannel: ChannelMode;
  headphoneChannel: ChannelMode;
  availableDevices: AudioDevice[];
  isSettingsOpen: boolean;
}

interface AudioConfigActions {
  setOutputMode: (mode: OutputMode) => void;
  setMasterDeviceId: (id: string) => void;
  setHeadphoneDeviceId: (id: string) => void;
  setMasterChannel: (ch: ChannelMode) => void;
  setHeadphoneChannel: (ch: ChannelMode) => void;
  toggleSettings: () => void;
  refreshDevices: () => Promise<void>;
}

export const useAudioConfigStore = create<AudioConfigState & AudioConfigActions>()(
  persist(
    (set) => ({
      outputMode: 'speakers',
      masterDeviceId: 'default',
      headphoneDeviceId: 'default',
      masterChannel: 'stereo',
      headphoneChannel: 'stereo',
      availableDevices: [],
      isSettingsOpen: false,

      setOutputMode: (mode) => set({ outputMode: mode }),
      setMasterDeviceId: (id) => set({ masterDeviceId: id }),
      setHeadphoneDeviceId: (id) => set({ headphoneDeviceId: id }),
      setMasterChannel: (ch) => set({ masterChannel: ch }),
      setHeadphoneChannel: (ch) => set({ headphoneChannel: ch }),
      toggleSettings: () => set((s) => ({ isSettingsOpen: !s.isSettingsOpen })),

      refreshDevices: async () => {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices
          .filter((d) => d.kind === 'audiooutput')
          .map((d) => ({ deviceId: d.deviceId, label: d.label || `Device ${d.deviceId.slice(0, 8)}` }));
        set({ availableDevices: audioOutputs });
      },
    }),
    {
      name: 'rdh-audio-config',
      partialize: (s) => ({
        outputMode: s.outputMode,
        masterDeviceId: s.masterDeviceId,
        headphoneDeviceId: s.headphoneDeviceId,
        masterChannel: s.masterChannel,
        headphoneChannel: s.headphoneChannel,
      }),
    }
  )
);

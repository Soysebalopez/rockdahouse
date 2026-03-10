'use client';

import { useEffect } from 'react';
import { useAudioConfigStore, type OutputMode, type ChannelMode } from '@/stores/useAudioConfigStore';

const OUTPUT_MODES: { value: OutputMode; label: string; desc: string }[] = [
  { value: 'speakers', label: 'Speakers Only', desc: 'All audio to one device' },
  { value: 'speakersHeadphones', label: 'Speakers + Headphones', desc: 'Master to speakers, CUE to headphones' },
  { value: 'separateDecks', label: 'Separate Decks', desc: 'Route decks to different outputs' },
];

const CHANNEL_OPTIONS: { value: ChannelMode; label: string }[] = [
  { value: 'stereo', label: 'Stereo' },
  { value: 'monoL', label: 'Mono L' },
  { value: 'monoR', label: 'Mono R' },
];

export default function AudioSettings() {
  const {
    isSettingsOpen, toggleSettings,
    outputMode, setOutputMode,
    masterDeviceId, setMasterDeviceId,
    headphoneDeviceId, setHeadphoneDeviceId,
    masterChannel, setMasterChannel,
    headphoneChannel, setHeadphoneChannel,
    availableDevices, refreshDevices,
  } = useAudioConfigStore();

  useEffect(() => {
    if (isSettingsOpen) refreshDevices();
  }, [isSettingsOpen, refreshDevices]);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-full max-w-md rounded-xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>Audio Output Settings</h2>
          <button
            onClick={toggleSettings}
            className="px-2 py-1 rounded text-xs font-bold"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          >
            CLOSE
          </button>
        </div>

        {/* Output mode */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Output Mode</label>
          <div className="flex flex-col gap-1">
            {OUTPUT_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setOutputMode(m.value)}
                className="flex flex-col items-start px-3 py-2 rounded text-left transition-colors"
                style={{
                  background: outputMode === m.value ? 'var(--accent-a)' : 'var(--bg-elevated)',
                  color: outputMode === m.value ? '#fff' : 'var(--text-secondary)',
                }}
              >
                <span className="text-xs font-bold">{m.label}</span>
                <span className="text-[10px] opacity-70">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Master device */}
        <DeviceSelect
          label="Master Output"
          devices={availableDevices}
          value={masterDeviceId}
          onChange={setMasterDeviceId}
          channel={masterChannel}
          onChannelChange={setMasterChannel}
        />

        {/* Headphone device (if applicable) */}
        {outputMode !== 'speakers' && (
          <DeviceSelect
            label="Headphone Output"
            devices={availableDevices}
            value={headphoneDeviceId}
            onChange={setHeadphoneDeviceId}
            channel={headphoneChannel}
            onChannelChange={setHeadphoneChannel}
          />
        )}

        {/* Notice */}
        <div className="px-3 py-2 rounded text-[10px] leading-relaxed" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
          YouTube audio routing is simulated via volume control. Sampler audio can be routed to the selected master device via Web Audio API.
        </div>
      </div>
    </div>
  );
}

function DeviceSelect({ label, devices, value, onChange, channel, onChannelChange }: {
  label: string;
  devices: { deviceId: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  channel: ChannelMode;
  onChannelChange: (ch: ChannelMode) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1.5 rounded text-xs"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
      >
        <option value="default">System Default</option>
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
        ))}
      </select>
      <div className="flex gap-1">
        {CHANNEL_OPTIONS.map((ch) => (
          <button
            key={ch.value}
            onClick={() => onChannelChange(ch.value)}
            className="px-2 py-0.5 rounded text-[9px] font-bold"
            style={{
              background: channel === ch.value ? 'var(--accent-a)' : 'var(--bg-elevated)',
              color: channel === ch.value ? '#fff' : 'var(--text-muted)',
            }}
          >
            {ch.label}
          </button>
        ))}
      </div>
    </div>
  );
}

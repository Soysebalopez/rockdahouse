'use client';

import { useState } from 'react';
import { useMidiStore, MIDI_PRESETS, type MidiAction } from '@/stores/useMidiStore';

interface ActionGroup {
  group: string;
  actions: { label: string; action: MidiAction }[];
}

const ACTION_GROUPS: ActionGroup[] = [
  {
    group: 'Deck A',
    actions: [
      { label: 'Play/Pause', action: 'deckA.play' },
      { label: 'Cue', action: 'deckA.cue' },
      { label: 'Volume', action: 'deckA.volume' },
      { label: 'Pitch', action: 'deckA.pitch' },
      { label: 'Sync', action: 'deckA.sync' },
      { label: 'Listen (CUE)', action: 'deckA.listen' },
      { label: 'Load', action: 'deckA.load' },
      { label: 'Scratch Mode', action: 'deckA.scratchMode' },
      { label: 'Hot Cue 1', action: 'deckA.hotcue1' },
      { label: 'Hot Cue 2', action: 'deckA.hotcue2' },
      { label: 'Hot Cue 3', action: 'deckA.hotcue3' },
      { label: 'Loop 4', action: 'deckA.loop4' },
      { label: 'Loop 8', action: 'deckA.loop8' },
      { label: 'Loop 16', action: 'deckA.loop16' },
      { label: 'FX Brake', action: 'deckA.fxBrake' },
      { label: 'FX Spinback', action: 'deckA.fxSpin' },
      { label: 'FX Repeat', action: 'deckA.fxRepeat' },
      { label: 'FX Echo', action: 'deckA.fxEcho' },
      { label: 'FX Filter', action: 'deckA.fxFilter' },
    ],
  },
  {
    group: 'Deck B',
    actions: [
      { label: 'Play/Pause', action: 'deckB.play' },
      { label: 'Cue', action: 'deckB.cue' },
      { label: 'Volume', action: 'deckB.volume' },
      { label: 'Pitch', action: 'deckB.pitch' },
      { label: 'Sync', action: 'deckB.sync' },
      { label: 'Listen (CUE)', action: 'deckB.listen' },
      { label: 'Load', action: 'deckB.load' },
      { label: 'Scratch Mode', action: 'deckB.scratchMode' },
      { label: 'Hot Cue 1', action: 'deckB.hotcue1' },
      { label: 'Hot Cue 2', action: 'deckB.hotcue2' },
      { label: 'Hot Cue 3', action: 'deckB.hotcue3' },
      { label: 'Loop 4', action: 'deckB.loop4' },
      { label: 'Loop 8', action: 'deckB.loop8' },
      { label: 'Loop 16', action: 'deckB.loop16' },
      { label: 'FX Brake', action: 'deckB.fxBrake' },
      { label: 'FX Spinback', action: 'deckB.fxSpin' },
      { label: 'FX Repeat', action: 'deckB.fxRepeat' },
      { label: 'FX Echo', action: 'deckB.fxEcho' },
      { label: 'FX Filter', action: 'deckB.fxFilter' },
    ],
  },
  {
    group: 'Deck C',
    actions: [
      { label: 'Play/Pause', action: 'deckC.play' },
      { label: 'Cue', action: 'deckC.cue' },
      { label: 'Volume', action: 'deckC.volume' },
      { label: 'Pitch', action: 'deckC.pitch' },
      { label: 'Sync', action: 'deckC.sync' },
      { label: 'Listen (CUE)', action: 'deckC.listen' },
      { label: 'Load', action: 'deckC.load' },
      { label: 'Scratch Mode', action: 'deckC.scratchMode' },
      { label: 'Hot Cue 1', action: 'deckC.hotcue1' },
      { label: 'Hot Cue 2', action: 'deckC.hotcue2' },
      { label: 'Hot Cue 3', action: 'deckC.hotcue3' },
      { label: 'Loop 4', action: 'deckC.loop4' },
      { label: 'Loop 8', action: 'deckC.loop8' },
      { label: 'Loop 16', action: 'deckC.loop16' },
      { label: 'FX Brake', action: 'deckC.fxBrake' },
      { label: 'FX Spinback', action: 'deckC.fxSpin' },
      { label: 'FX Repeat', action: 'deckC.fxRepeat' },
      { label: 'FX Echo', action: 'deckC.fxEcho' },
      { label: 'FX Filter', action: 'deckC.fxFilter' },
    ],
  },
  {
    group: 'Deck D',
    actions: [
      { label: 'Play/Pause', action: 'deckD.play' },
      { label: 'Cue', action: 'deckD.cue' },
      { label: 'Volume', action: 'deckD.volume' },
      { label: 'Pitch', action: 'deckD.pitch' },
      { label: 'Sync', action: 'deckD.sync' },
      { label: 'Listen (CUE)', action: 'deckD.listen' },
      { label: 'Load', action: 'deckD.load' },
      { label: 'Scratch Mode', action: 'deckD.scratchMode' },
      { label: 'Hot Cue 1', action: 'deckD.hotcue1' },
      { label: 'Hot Cue 2', action: 'deckD.hotcue2' },
      { label: 'Hot Cue 3', action: 'deckD.hotcue3' },
      { label: 'Loop 4', action: 'deckD.loop4' },
      { label: 'Loop 8', action: 'deckD.loop8' },
      { label: 'Loop 16', action: 'deckD.loop16' },
      { label: 'FX Brake', action: 'deckD.fxBrake' },
      { label: 'FX Spinback', action: 'deckD.fxSpin' },
      { label: 'FX Repeat', action: 'deckD.fxRepeat' },
      { label: 'FX Echo', action: 'deckD.fxEcho' },
      { label: 'FX Filter', action: 'deckD.fxFilter' },
    ],
  },
  {
    group: 'Sampler',
    actions: [
      { label: 'Pad 1', action: 'sampler.pad1' },
      { label: 'Pad 2', action: 'sampler.pad2' },
      { label: 'Pad 3', action: 'sampler.pad3' },
      { label: 'Pad 4', action: 'sampler.pad4' },
      { label: 'Pad 5', action: 'sampler.pad5' },
      { label: 'Pad 6', action: 'sampler.pad6' },
      { label: 'Pad 7', action: 'sampler.pad7' },
      { label: 'Pad 8', action: 'sampler.pad8' },
    ],
  },
  {
    group: 'Master',
    actions: [
      { label: 'Crossfader', action: 'crossfader' },
      { label: 'Master Volume', action: 'masterVolume' },
    ],
  },
];

export default function MidiStatus() {
  const { connected, deviceName, mappings, learnTarget, lastMessage, activePreset, setLearnTarget, removeMapping, clearMappings, loadPreset } = useMidiStore();
  const [showPanel, setShowPanel] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const getMappingFor = (action: MidiAction) => mappings.find((m) => m.action === action);
  const mappedCount = mappings.length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
        style={{
          background: connected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          color: connected ? 'var(--vu-green)' : 'var(--text-muted)',
          border: '1px solid var(--border-default)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? 'var(--vu-green)' : 'var(--text-muted)' }} />
        {connected ? `MIDI: ${deviceName}` : 'MIDI'}
      </button>

      {showPanel && (
        <div
          className="absolute right-0 top-full mt-2 w-96 rounded-xl p-3 z-50 animate-slide-up"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              MIDI Mappings
              {activePreset && (
                <span className="ml-1.5 text-[9px] font-normal px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {activePreset}
                </span>
              )}
            </span>
            <div className="flex gap-1">
              <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{mappedCount} mapped</span>
              <button onClick={clearMappings} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                Reset
              </button>
            </div>
          </div>

          {/* Preset selector */}
          <div className="flex gap-1 mb-2">
            <span className="text-[10px] py-1" style={{ color: 'var(--text-muted)' }}>Preset:</span>
            {MIDI_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                className="px-2 py-0.5 rounded text-[10px] font-bold"
                style={{
                  background: activePreset === preset.name ? 'var(--accent-a)' : 'var(--bg-elevated)',
                  color: activePreset === preset.name ? '#fff' : 'var(--text-muted)',
                }}
              >
                {preset.name.length > 20 ? preset.name.slice(0, 20) + '...' : preset.name}
              </button>
            ))}
          </div>

          {/* Learn status */}
          {learnTarget && (
            <div className="mb-2 px-2 py-1.5 rounded-lg text-xs animate-pulse" style={{ background: 'var(--accent-a-dim)', color: 'var(--accent-a)' }}>
              Move a control on your MIDI device...
            </div>
          )}

          {lastMessage && (
            <div className="mb-2 text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              Last: ch{lastMessage.channel} {lastMessage.type} #{lastMessage.note} val={lastMessage.value}
            </div>
          )}

          {/* Action groups (collapsible) */}
          <div className="flex flex-col gap-0.5 overflow-y-auto" style={{ maxHeight: 350 }}>
            {ACTION_GROUPS.map(({ group, actions }) => {
              const isExpanded = expandedGroup === group;
              const groupMapped = actions.filter((a) => getMappingFor(a.action)).length;

              return (
                <div key={group}>
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : group)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-bold"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                  >
                    <span>{group}</span>
                    <span className="text-[9px] font-normal" style={{ color: 'var(--text-muted)' }}>
                      {groupMapped}/{actions.length} {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="flex flex-col gap-0.5 pl-1 py-0.5">
                      {actions.map(({ label, action }) => {
                        const mapping = getMappingFor(action);
                        const isLearning = learnTarget === action;
                        return (
                          <div
                            key={action}
                            className="flex items-center justify-between px-2 py-0.5 rounded text-[11px]"
                            style={{
                              background: isLearning ? 'var(--accent-a-dim)' : 'transparent',
                            }}
                          >
                            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                            <div className="flex items-center gap-1">
                              {mapping && (
                                <>
                                  <span className="tabular-nums text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                    ch{mapping.channel} {mapping.type}#{mapping.note}
                                  </span>
                                  <button
                                    onClick={() => removeMapping(action)}
                                    className="text-[9px] px-1 rounded"
                                    style={{ color: 'var(--vu-red)' }}
                                  >x</button>
                                </>
                              )}
                              <button
                                onClick={() => setLearnTarget(isLearning ? null : action)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                style={{
                                  background: isLearning ? 'var(--accent-a)' : 'var(--bg-surface)',
                                  color: isLearning ? '#fff' : 'var(--text-muted)',
                                }}
                              >
                                {isLearning ? 'Cancel' : 'Learn'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useMidiStore, type MidiAction } from '@/stores/useMidiStore';

const LEARNABLE_ACTIONS: { label: string; action: MidiAction }[] = [
  { label: 'Deck A Play', action: 'deckA.play' },
  { label: 'Deck A Volume', action: 'deckA.volume' },
  { label: 'Deck A EQ Hi', action: 'deckA.eqHigh' },
  { label: 'Deck A EQ Mid', action: 'deckA.eqMid' },
  { label: 'Deck A EQ Lo', action: 'deckA.eqLow' },
  { label: 'Deck A Hot Cue 1', action: 'deckA.hotcue1' },
  { label: 'Deck A Hot Cue 2', action: 'deckA.hotcue2' },
  { label: 'Deck A Hot Cue 3', action: 'deckA.hotcue3' },
  { label: 'Deck A Loop 4', action: 'deckA.loop4' },
  { label: 'Deck A Loop 8', action: 'deckA.loop8' },
  { label: 'Deck B Play', action: 'deckB.play' },
  { label: 'Deck B Volume', action: 'deckB.volume' },
  { label: 'Deck B EQ Hi', action: 'deckB.eqHigh' },
  { label: 'Deck B EQ Mid', action: 'deckB.eqMid' },
  { label: 'Deck B EQ Lo', action: 'deckB.eqLow' },
  { label: 'Deck B Hot Cue 1', action: 'deckB.hotcue1' },
  { label: 'Deck B Hot Cue 2', action: 'deckB.hotcue2' },
  { label: 'Deck B Hot Cue 3', action: 'deckB.hotcue3' },
  { label: 'Deck B Loop 4', action: 'deckB.loop4' },
  { label: 'Deck B Loop 8', action: 'deckB.loop8' },
  { label: 'Deck C Play', action: 'deckC.play' },
  { label: 'Deck C Volume', action: 'deckC.volume' },
  { label: 'Deck C EQ Hi', action: 'deckC.eqHigh' },
  { label: 'Deck C EQ Mid', action: 'deckC.eqMid' },
  { label: 'Deck C EQ Lo', action: 'deckC.eqLow' },
  { label: 'Deck D Play', action: 'deckD.play' },
  { label: 'Deck D Volume', action: 'deckD.volume' },
  { label: 'Deck D EQ Hi', action: 'deckD.eqHigh' },
  { label: 'Deck D EQ Mid', action: 'deckD.eqMid' },
  { label: 'Deck D EQ Lo', action: 'deckD.eqLow' },
  { label: 'Crossfader', action: 'crossfader' },
  { label: 'Master Volume', action: 'masterVolume' },
];

export default function MidiStatus() {
  const { connected, deviceName, mappings, learnTarget, lastMessage, setLearnTarget, removeMapping, clearMappings } = useMidiStore();
  const [showPanel, setShowPanel] = useState(false);

  const getMappingFor = (action: MidiAction) => mappings.find((m) => m.action === action);

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
          className="absolute right-0 top-full mt-2 w-80 rounded-xl p-3 z-50 animate-slide-up"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>MIDI Mappings</span>
            <button onClick={clearMappings} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              Reset
            </button>
          </div>

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

          <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 300 }}>
            {LEARNABLE_ACTIONS.map(({ label, action }) => {
              const mapping = getMappingFor(action);
              const isLearning = learnTarget === action;
              return (
                <div
                  key={action}
                  className="flex items-center justify-between px-2 py-1 rounded text-[11px]"
                  style={{
                    background: isLearning ? 'var(--accent-a-dim)' : 'var(--bg-elevated)',
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
                        >✕</button>
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
        </div>
      )}
    </div>
  );
}

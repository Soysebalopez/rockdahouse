'use client';

import { useCallback, useEffect, useRef } from 'react';
import Deck from './Deck';
import Mixer from './Mixer';
import BPMSync from './BPMSync';
import CueControls from './CueControls';
import SearchPanel from './SearchPanel';
import Playlist from './Playlist';
import MidiStatus from './MidiStatus';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { useMidi } from '@/hooks/useMidi';
import { useDeckAStore, useDeckBStore, useDeckCStore, useDeckDStore, getDeckStoreById } from '@/stores/useDeckStore';
import { useMixerStore } from '@/stores/useMixerStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { DeckId } from '@/lib/types';

const ALL_DECKS: DeckId[] = ['A', 'B', 'C', 'D'];
const DECK_STORES = { A: useDeckAStore, B: useDeckBStore, C: useDeckCStore, D: useDeckDStore } as const;
const ACCENT_COLORS: Record<DeckId, string> = {
  A: 'var(--accent-a)',
  B: 'var(--accent-b)',
  C: 'var(--accent-c)',
  D: 'var(--accent-d)',
};

export default function Console() {
  useKeyboardShortcuts();
  useMidi();

  const deckMode = useMixerStore((s) => s.deckMode);
  const setDeckMode = useMixerStore((s) => s.setDeckMode);
  const crossfaderPosition = useMixerStore((s) => s.crossfaderPosition);
  const masterVolume = useMixerStore((s) => s.masterVolume);
  const vuLevels = useMixerStore((s) => s.vuLevels);
  const vuLevelMaster = useMixerStore((s) => s.vuLevelMaster);
  const crossfaderAssign = useMixerStore((s) => s.crossfaderAssign);
  const setCrossfaderPosition = useMixerStore((s) => s.setCrossfaderPosition);
  const setMasterVolume = useMixerStore((s) => s.setMasterVolume);
  const setCrossfaderAssign = useMixerStore((s) => s.setCrossfaderAssign);

  // Per-deck volumes via selectors
  const volumeA = useDeckAStore((s) => s.volume);
  const volumeB = useDeckBStore((s) => s.volume);
  const volumeC = useDeckCStore((s) => s.volume);
  const volumeD = useDeckDStore((s) => s.volume);
  const setVolumeA = useDeckAStore((s) => s.setVolume);
  const setVolumeB = useDeckBStore((s) => s.setVolume);
  const setVolumeC = useDeckCStore((s) => s.setVolume);
  const setVolumeD = useDeckDStore((s) => s.setVolume);

  const volumes: Record<DeckId, number> = { A: volumeA, B: volumeB, C: volumeC, D: volumeD };
  const setVolumes: Record<DeckId, (v: number) => void> = {
    A: setVolumeA, B: setVolumeB, C: setVolumeC, D: setVolumeD,
  };

  const vuAnimRef = useRef<number>(undefined);

  // Main animation loop: applies volume to YouTube players + simulates VU meters
  useEffect(() => {
    const tick = () => {
      const mx = useMixerStore.getState();
      const pos = mx.crossfaderPosition;
      const gainSideA = Math.cos(pos * Math.PI / 2);
      const gainSideB = Math.sin(pos * Math.PI / 2);

      const activeDecks = mx.deckMode === 4 ? ALL_DECKS : (['A', 'B'] as DeckId[]);
      let maxLevel = 0;

      for (const deckId of activeDecks) {
        const d = DECK_STORES[deckId].getState();
        const side = mx.crossfaderAssign[deckId];
        const gain = side === 'A' ? gainSideA : gainSideB;

        // Apply effective volume to YouTube player
        const effective = d.volume * gain * mx.masterVolume * 100;
        d.playerRef?.setVolume(effective);

        // Simulate VU level
        const base = d.isPlaying ? d.volume * 0.7 : 0;
        const vu = base + (base > 0 ? Math.random() * 0.2 : 0);
        mx.setVuLevel(deckId, vu);

        maxLevel = Math.max(maxLevel, base * gain);
      }

      mx.setVuLevelMaster(maxLevel * mx.masterVolume + (maxLevel > 0 ? Math.random() * 0.1 : 0));
      vuAnimRef.current = requestAnimationFrame(tick);
    };
    vuAnimRef.current = requestAnimationFrame(tick);
    return () => { if (vuAnimRef.current) cancelAnimationFrame(vuAnimRef.current); };
  }, []);

  const handleLoadToDeck = useCallback((videoId: string, title: string, channel: string, thumbnail: string, deckId: DeckId) => {
    getDeckStoreById(deckId).getState().loadTrack({ videoId, title, channel, thumbnail });
  }, []);

  const activeDecks = deckMode === 4 ? ALL_DECKS : (['A', 'B'] as DeckId[]);

  const channels = activeDecks.map((id) => ({
    id,
    volume: volumes[id],
    vuLevel: vuLevels[id],
    accentColor: ACCENT_COLORS[id],
    crossfaderAssign: crossfaderAssign[id],
    onVolumeChange: setVolumes[id],
    onAssignChange: (side: 'A' | 'B') => setCrossfaderAssign(id, side),
  }));

  return (
    <div className="flex flex-col gap-3 p-4 min-h-screen max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between py-3 px-1">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight" style={{
            background: 'linear-gradient(135deg, var(--accent-a), var(--accent-b))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            ROCKDAHOUSE
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            v0.3
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {/* Deck mode toggle */}
          <div className="flex gap-0.5">
            <button
              onClick={() => setDeckMode(2)}
              className="px-2 py-1 rounded text-[10px] font-bold"
              style={{
                background: deckMode === 2 ? 'var(--accent-a)' : 'var(--bg-elevated)',
                color: deckMode === 2 ? '#fff' : 'var(--text-muted)',
              }}
            >2 DECK</button>
            <button
              onClick={() => setDeckMode(4)}
              className="px-2 py-1 rounded text-[10px] font-bold"
              style={{
                background: deckMode === 4 ? 'var(--accent-a)' : 'var(--bg-elevated)',
                color: deckMode === 4 ? '#fff' : 'var(--text-muted)',
              }}
            >4 DECK</button>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--bg-elevated)' }}>S</kbd> search
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--bg-elevated)' }}>P</kbd> playlist
          </span>
          <MidiStatus />
        </div>
      </header>

      {/* Decks */}
      <div className={`grid gap-3 ${deckMode === 4 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {activeDecks.map((id) => (
          <Deck key={id} id={id} />
        ))}
      </div>

      {/* BPM Sync + Cue */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <BPMSync />
        <CueControls />
      </div>

      {/* Mixer */}
      <Mixer
        channels={channels}
        masterVolume={masterVolume}
        crossfaderPosition={crossfaderPosition}
        vuLevelMaster={vuLevelMaster}
        onMasterVolumeChange={setMasterVolume}
        onCrossfaderChange={setCrossfaderPosition}
      />

      {/* Search + Playlist */}
      <SearchPanel onLoadToDeck={handleLoadToDeck} />
      <Playlist onLoadToDeck={handleLoadToDeck} />
    </div>
  );
}

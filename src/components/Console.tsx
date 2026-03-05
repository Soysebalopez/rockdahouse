'use client';

import { useCallback, useEffect, useRef } from 'react';
import Deck from './Deck';
import Mixer from './Mixer';
import BPMSync from './BPMSync';
import CueControls from './CueControls';
import SearchPanel from './SearchPanel';
import Playlist from './Playlist';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';
import { useMixerStore } from '@/stores/useMixerStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { DeckId } from '@/lib/types';

export default function Console() {
  useKeyboardShortcuts();

  // Subscribe only to the specific slices needed for rendering
  const volumeA = useDeckAStore((s) => s.volume);
  const volumeB = useDeckBStore((s) => s.volume);
  const setVolumeA = useDeckAStore((s) => s.setVolume);
  const setVolumeB = useDeckBStore((s) => s.setVolume);

  const crossfaderPosition = useMixerStore((s) => s.crossfaderPosition);
  const masterVolume = useMixerStore((s) => s.masterVolume);
  const vuLevelA = useMixerStore((s) => s.vuLevelA);
  const vuLevelB = useMixerStore((s) => s.vuLevelB);
  const vuLevelMaster = useMixerStore((s) => s.vuLevelMaster);
  const setCrossfaderPosition = useMixerStore((s) => s.setCrossfaderPosition);
  const setMasterVolume = useMixerStore((s) => s.setMasterVolume);

  const vuAnimRef = useRef<number>(undefined);

  // Main animation loop: applies volume to YouTube players + simulates VU meters
  // Runs via getState() to avoid triggering re-renders
  useEffect(() => {
    const tick = () => {
      const dA = useDeckAStore.getState();
      const dB = useDeckBStore.getState();
      const mx = useMixerStore.getState();

      const pos = mx.crossfaderPosition;
      const gainA = Math.cos(pos * Math.PI / 2);
      const gainB = Math.sin(pos * Math.PI / 2);

      // Apply effective volume to YouTube players
      const effectiveA = dA.volume * gainA * mx.masterVolume * 100;
      const effectiveB = dB.volume * gainB * mx.masterVolume * 100;
      dA.playerRef?.setVolume(effectiveA);
      dB.playerRef?.setVolume(effectiveB);

      // Simulate VU levels
      const baseA = dA.isPlaying ? dA.volume * 0.7 : 0;
      const baseB = dB.isPlaying ? dB.volume * 0.7 : 0;
      mx.setVuLevelA(baseA + (baseA > 0 ? Math.random() * 0.2 : 0));
      mx.setVuLevelB(baseB + (baseB > 0 ? Math.random() * 0.2 : 0));
      mx.setVuLevelMaster(
        Math.max(baseA * gainA, baseB * gainB) * mx.masterVolume +
        (baseA + baseB > 0 ? Math.random() * 0.1 : 0)
      );

      vuAnimRef.current = requestAnimationFrame(tick);
    };
    vuAnimRef.current = requestAnimationFrame(tick);
    return () => { if (vuAnimRef.current) cancelAnimationFrame(vuAnimRef.current); };
  }, []);

  const handleLoadToDeck = useCallback((videoId: string, title: string, channel: string, thumbnail: string, deckId: DeckId) => {
    const store = deckId === 'A' ? useDeckAStore : useDeckBStore;
    store.getState().loadTrack({ videoId, title, channel, thumbnail });
  }, []);

  return (
    <div className="flex flex-col gap-3 p-4 min-h-screen max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            🎧 RockDaHouse
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            MVP
          </span>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-elevated)' }}>S</kbd> search
          <span className="mx-1">·</span>
          <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-elevated)' }}>P</kbd> playlist
        </div>
      </header>

      {/* Decks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Deck id="A" />
        <Deck id="B" />
      </div>

      {/* BPM Sync + Cue */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <BPMSync />
        <CueControls />
      </div>

      {/* Mixer */}
      <Mixer
        volumeA={volumeA}
        volumeB={volumeB}
        masterVolume={masterVolume}
        crossfaderPosition={crossfaderPosition}
        vuLevelA={vuLevelA}
        vuLevelB={vuLevelB}
        vuLevelMaster={vuLevelMaster}
        onVolumeAChange={setVolumeA}
        onVolumeBChange={setVolumeB}
        onMasterVolumeChange={setMasterVolume}
        onCrossfaderChange={setCrossfaderPosition}
      />

      {/* Search + Playlist */}
      <SearchPanel onLoadToDeck={handleLoadToDeck} />
      <Playlist onLoadToDeck={handleLoadToDeck} />
    </div>
  );
}

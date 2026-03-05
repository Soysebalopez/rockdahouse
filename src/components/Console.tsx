'use client';

import { useCallback, useEffect, useRef } from 'react';
import Deck from './Deck';
import Mixer from './Mixer';
import SearchPanel from './SearchPanel';
import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';
import { useMixerStore } from '@/stores/useMixerStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { DeckId } from '@/lib/types';

export default function Console() {
  useKeyboardShortcuts();

  const deckA = useDeckAStore();
  const deckB = useDeckBStore();
  const mixer = useMixerStore();

  const vuAnimRef = useRef<number>(undefined);

  // Apply crossfader + master volume to YouTube players
  useEffect(() => {
    const pos = mixer.crossfaderPosition;
    // Equal power curve
    const gainA = Math.cos(pos * Math.PI / 2);
    const gainB = Math.sin(pos * Math.PI / 2);

    const effectiveA = deckA.volume * gainA * mixer.masterVolume;
    const effectiveB = deckB.volume * gainB * mixer.masterVolume;

    deckA.playerRef?.setVolume(effectiveA * 100);
    deckB.playerRef?.setVolume(effectiveB * 100);
  }, [mixer.crossfaderPosition, mixer.masterVolume, deckA.volume, deckB.volume, deckA.playerRef, deckB.playerRef]);

  // Simulate VU meters
  useEffect(() => {
    const tick = () => {
      const baseA = deckA.isPlaying ? deckA.volume * 0.7 : 0;
      const baseB = deckB.isPlaying ? deckB.volume * 0.7 : 0;
      const pos = useMixerStore.getState().crossfaderPosition;
      const master = useMixerStore.getState().masterVolume;
      const gainA = Math.cos(pos * Math.PI / 2);
      const gainB = Math.sin(pos * Math.PI / 2);

      mixer.setVuLevelA(baseA + (baseA > 0 ? Math.random() * 0.2 : 0));
      mixer.setVuLevelB(baseB + (baseB > 0 ? Math.random() * 0.2 : 0));
      mixer.setVuLevelMaster(
        Math.max(baseA * gainA, baseB * gainB) * master +
        (baseA + baseB > 0 ? Math.random() * 0.1 : 0)
      );

      vuAnimRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { if (vuAnimRef.current) cancelAnimationFrame(vuAnimRef.current); };
  }, [deckA.isPlaying, deckB.isPlaying, deckA.volume, deckB.volume, mixer]);

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
          Press <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-elevated)' }}>S</kbd> to toggle search
        </div>
      </header>

      {/* Decks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Deck id="A" />
        <Deck id="B" />
      </div>

      {/* Mixer */}
      <Mixer
        volumeA={deckA.volume}
        volumeB={deckB.volume}
        masterVolume={mixer.masterVolume}
        crossfaderPosition={mixer.crossfaderPosition}
        vuLevelA={mixer.vuLevelA}
        vuLevelB={mixer.vuLevelB}
        vuLevelMaster={mixer.vuLevelMaster}
        onVolumeAChange={deckA.setVolume}
        onVolumeBChange={deckB.setVolume}
        onMasterVolumeChange={mixer.setMasterVolume}
        onCrossfaderChange={mixer.setCrossfaderPosition}
      />

      {/* Search */}
      <SearchPanel onLoadToDeck={handleLoadToDeck} />
    </div>
  );
}

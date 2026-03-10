'use client';

import { useCallback, useEffect, useRef } from 'react';
import Deck from './Deck';
import DualWaveform from './DualWaveform';
import Mixer from './Mixer';
import BPMSync from './BPMSync';
import CueControls from './CueControls';
import SearchPanel from './SearchPanel';
import Playlist from './Playlist';
import MidiStatus from './MidiStatus';
import Sampler from './Sampler';
import Equalizer from './Equalizer';
import AudioSettings from './AudioSettings';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import { useAudioConfigStore } from '@/stores/useAudioConfigStore';
import { useThemeStore } from '@/stores/useThemeStore';
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

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

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

  // YouTube-supported playback rates for sync snapping
  const SUPPORTED_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const snapToRate = (rate: number) => {
    let closest = SUPPORTED_RATES[0];
    let minDiff = Math.abs(rate - closest);
    for (const r of SUPPORTED_RATES) {
      const diff = Math.abs(rate - r);
      if (diff < minDiff) { minDiff = diff; closest = r; }
    }
    return closest;
  };

  // Track last applied sync rates to avoid redundant setPlaybackRate calls
  const lastSyncRateRef = useRef<Record<string, number>>({});

  // Main animation loop: applies volume to YouTube players + simulates VU meters + continuous sync
  useEffect(() => {
    const tick = () => {
      const mx = useMixerStore.getState();
      const pos = mx.crossfaderPosition;
      const gainSideA = Math.cos(pos * Math.PI / 2);
      const gainSideB = Math.sin(pos * Math.PI / 2);

      const activeDecks = mx.deckMode === 4 ? ALL_DECKS : (['A', 'B'] as DeckId[]);
      let maxLevel = 0;

      // Continuous sync enforcement (A↔B)
      const dA = DECK_STORES.A.getState();
      const dB = DECK_STORES.B.getState();
      if (dA.syncLocked && dA.bpm && dB.bpm) {
        const targetRate = snapToRate(dB.bpm / dA.bpm);
        if (lastSyncRateRef.current.A !== targetRate) {
          lastSyncRateRef.current.A = targetRate;
          DECK_STORES.A.getState().setPlaybackRate(targetRate);
        }
      }
      if (dB.syncLocked && dA.bpm && dB.bpm) {
        const targetRate = snapToRate(dA.bpm / dB.bpm);
        if (lastSyncRateRef.current.B !== targetRate) {
          lastSyncRateRef.current.B = targetRate;
          DECK_STORES.B.getState().setPlaybackRate(targetRate);
        }
      }

      for (const deckId of activeDecks) {
        const d = DECK_STORES[deckId].getState();
        const side = mx.crossfaderAssign[deckId];
        const gain = side === 'A' ? gainSideA : gainSideB;

        // Master volume path
        const masterVol = d.volume * gain * mx.masterVolume * 100;

        // CUE: if this deck is cue-targeted, blend cue solo with master
        const isCued = mx.cueTargets[deckId];
        let effective = masterVol;
        if (isCued) {
          const cueVol = (1 - mx.cueMix) * d.volume * 100;
          effective = Math.max(cueVol, masterVol);
        }

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

  const cueTargets = useMixerStore((s) => s.cueTargets);
  const toggleCue = useMixerStore((s) => s.toggleCue);
  const showSampler = useMixerStore((s) => s.showSampler);
  const toggleSampler = useMixerStore((s) => s.toggleSampler);

  const channels = activeDecks.map((id) => ({
    id,
    volume: volumes[id],
    vuLevel: vuLevels[id],
    accentColor: ACCENT_COLORS[id],
    crossfaderAssign: crossfaderAssign[id],
    isCued: cueTargets[id],
    onVolumeChange: setVolumes[id],
    onAssignChange: (side: 'A' | 'B') => setCrossfaderAssign(id, side),
    onCueToggle: () => toggleCue(id),
  }));

  return (
    <div className="flex flex-col gap-1.5 p-2 pb-14 min-h-screen max-w-[1800px] mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between py-1 px-1">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight" style={{
            background: 'var(--title-gradient)',
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
          <button
            onClick={toggleTheme}
            className="px-2 py-1 rounded text-[10px] font-bold"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} skin`}
          >
            {theme === 'dark' ? '☀ LIGHT' : '● DARK'}
          </button>
          <button
            onClick={toggleSampler}
            className="px-2 py-1 rounded text-[10px] font-bold"
            style={{
              background: showSampler ? 'var(--accent-a)' : 'var(--bg-elevated)',
              color: showSampler ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border-default)',
            }}
            title="Toggle Sampler Panel"
          >
            SAMPLER
          </button>
          <button
            onClick={() => useAudioConfigStore.getState().toggleSettings()}
            className="px-2 py-1 rounded text-[10px] font-bold"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
            }}
            title="Audio Output Settings"
          >
            AUDIO
          </button>
          <MidiStatus />
        </div>
      </header>
      <AudioSettings />

      {/* Main DJ Layout: [Deck A] [Center Controls] [Deck B] */}
      <div className="grid gap-2 grid-cols-1 lg:grid-cols-[1fr_auto_1fr]">
        {/* Deck A */}
        <Deck key="A" id="A" />

        {/* Center Column: Waveform + Sync + Mixer */}
        <div className="flex flex-col gap-2 items-center justify-start min-w-[220px]">
          <DualWaveform />
          <BPMSync />
          <CueControls />
          <Mixer
            channels={channels}
            masterVolume={masterVolume}
            crossfaderPosition={crossfaderPosition}
            vuLevelMaster={vuLevelMaster}
            onMasterVolumeChange={setMasterVolume}
            onCrossfaderChange={setCrossfaderPosition}
          />
        </div>

        {/* Deck B */}
        <Deck key="B" id="B" />
      </div>

      {/* Extra decks row (4-deck mode) */}
      {deckMode === 4 && (
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
          <Deck key="C" id="C" />
          <Deck key="D" id="D" />
        </div>
      )}

      {/* Search + Sampler row */}
      <div className={`grid gap-2 items-stretch ${showSampler ? 'grid-cols-1 lg:grid-cols-[3fr_2fr]' : 'grid-cols-1'}`}>
        <SearchPanel onLoadToDeck={handleLoadToDeck} />
        {showSampler && <Sampler />}
      </div>
      <Playlist onLoadToDeck={handleLoadToDeck} />
      <Equalizer />
    </div>
  );
}

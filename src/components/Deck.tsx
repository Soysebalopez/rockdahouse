'use client';

import { useCallback, useEffect, useRef } from 'react';
import YouTubePlayer from './YouTubePlayer';
import TransportControls from './TransportControls';
import EQControls from './EQControls';
import BPMDisplay from './BPMDisplay';
import TrackInfo from './TrackInfo';
import type { DeckId } from '@/lib/types';
import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';

interface DeckProps {
  id: DeckId;
}

const ACCENTS: Record<DeckId, string> = {
  A: 'var(--accent-a)',
  B: 'var(--accent-b)',
};

export default function Deck({ id }: DeckProps) {
  const store = id === 'A' ? useDeckAStore : useDeckBStore;
  const {
    videoId, title, channel, duration, currentTime, isPlaying, volume,
    eqLow, eqMid, eqHigh,
    playerRef, setPlayerRef, setPlaying, setVolume, setEQ, setBPM,
    setCurrentTime, setDuration,
  } = store();

  const accent = ACCENTS[id];
  const timeUpdateRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const handleReady = useCallback((player: YT.Player) => {
    setPlayerRef(player);
  }, [setPlayerRef]);

  const handleStateChange = useCallback((state: number) => {
    if (typeof window === 'undefined' || !window.YT) return;
    setPlaying(state === window.YT.PlayerState.PLAYING);
  }, [setPlaying]);

  // Update current time periodically
  useEffect(() => {
    if (isPlaying && playerRef) {
      timeUpdateRef.current = setInterval(() => {
        setCurrentTime(playerRef.getCurrentTime?.() ?? 0);
        const d = playerRef.getDuration?.() ?? 0;
        if (d > 0) setDuration(d);
      }, 250);
    } else {
      if (timeUpdateRef.current) clearInterval(timeUpdateRef.current);
    }
    return () => { if (timeUpdateRef.current) clearInterval(timeUpdateRef.current); };
  }, [isPlaying, playerRef, setCurrentTime, setDuration]);

  // Sync volume to player
  useEffect(() => {
    playerRef?.setVolume(volume * 100);
  }, [volume, playerRef]);

  const handlePlay = () => playerRef?.playVideo();
  const handlePause = () => playerRef?.pauseVideo();
  const handleStop = () => {
    playerRef?.pauseVideo();
    playerRef?.seekTo(0, true);
    setCurrentTime(0);
  };
  const handleSeek = (seconds: number) => {
    playerRef?.seekTo(seconds, true);
    setCurrentTime(seconds);
  };

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: `1px solid var(--border-default)` }}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
        <span className="text-sm font-bold" style={{ color: accent }}>DECK {id}</span>
      </div>

      <YouTubePlayer deckId={id} videoId={videoId} onReady={handleReady} onStateChange={handleStateChange} />

      <TrackInfo title={title} channel={channel} currentTime={currentTime} duration={duration} onSeek={handleSeek} accentColor={accent} />

      <div className="flex items-center gap-4">
        <TransportControls isPlaying={isPlaying} onPlay={handlePlay} onPause={handlePause} onStop={handleStop} accentColor={accent} />
        <EQControls
          eqHigh={eqHigh}
          eqMid={eqMid}
          eqLow={eqLow}
          onChangeHigh={(v) => setEQ('high', v)}
          onChangeMid={(v) => setEQ('mid', v)}
          onChangeLow={(v) => setEQ('low', v)}
          accentColor={accent}
        />
        <BPMDisplay onBpmChange={setBPM} accentColor={accent} />
      </div>
    </div>
  );
}

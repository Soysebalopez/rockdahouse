'use client';

import { useCallback, useEffect, useRef } from 'react';
import YouTubePlayer from './YouTubePlayer';
import Waveform from './Waveform';
import TransportControls from './TransportControls';
import EQControls from './EQControls';
import BPMDisplay from './BPMDisplay';
import TrackInfo from './TrackInfo';
import LoopControls from './LoopControls';
import HotCues from './HotCues';
import type { DeckId } from '@/lib/types';
import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';

interface DeckProps {
  id: DeckId;
}

const ACCENTS: Record<DeckId, string> = {
  A: 'var(--accent-a)',
  B: 'var(--accent-b)',
};

const ACCENT_HEX: Record<DeckId, string> = {
  A: '#ec4899',
  B: '#3b82f6',
};

const DIM_HEX: Record<DeckId, string> = {
  A: '#9d174d',
  B: '#1e40af',
};

export default function Deck({ id }: DeckProps) {
  const store = id === 'A' ? useDeckAStore : useDeckBStore;
  const {
    videoId, title, channel, duration, currentTime, isPlaying, volume,
    eqLow, eqMid, eqHigh, bpm, loop, hotCues,
    playerRef, setPlayerRef, setPlaying, setVolume, setEQ, setBPM,
    setCurrentTime, setDuration, setLoop, clearLoop, setHotCue,
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

  // Update current time + enforce loop
  useEffect(() => {
    if (isPlaying && playerRef) {
      timeUpdateRef.current = setInterval(() => {
        const t = playerRef.getCurrentTime?.() ?? 0;
        setCurrentTime(t);
        const d = playerRef.getDuration?.() ?? 0;
        if (d > 0) setDuration(d);

        // Loop enforcement: if past loop end, seek back to loop start
        const currentLoop = (id === 'A' ? useDeckAStore : useDeckBStore).getState().loop;
        if (currentLoop.active && currentLoop.end > 0 && t >= currentLoop.end) {
          playerRef.seekTo(currentLoop.start, true);
        }
      }, 50); // 50ms for tight loop enforcement
    } else {
      if (timeUpdateRef.current) clearInterval(timeUpdateRef.current);
    }
    return () => { if (timeUpdateRef.current) clearInterval(timeUpdateRef.current); };
  }, [isPlaying, playerRef, setCurrentTime, setDuration, id]);

  const handlePlay = () => playerRef?.playVideo();
  const handlePause = () => playerRef?.pauseVideo();
  const handleStop = () => {
    playerRef?.pauseVideo();
    playerRef?.seekTo(0, true);
    setCurrentTime(0);
    clearLoop();
  };
  const handleSeek = (seconds: number) => {
    playerRef?.seekTo(seconds, true);
    setCurrentTime(seconds);
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: `1px solid var(--border-default)` }}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
        <span className="text-sm font-bold" style={{ color: accent }}>DECK {id}</span>
      </div>

      <YouTubePlayer deckId={id} videoId={videoId} onReady={handleReady} onStateChange={handleStateChange} />

      <Waveform
        videoId={videoId}
        currentTime={currentTime}
        duration={duration}
        accentColor={ACCENT_HEX[id]}
        dimColor={DIM_HEX[id]}
        loop={loop.active ? { start: loop.start, end: loop.end } : undefined}
        hotCues={hotCues}
      />

      <TrackInfo title={title} channel={channel} currentTime={currentTime} duration={duration} onSeek={handleSeek} accentColor={accent} />

      <div className="flex items-center gap-4 flex-wrap">
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
        <BPMDisplay trackTitle={title} onBpmChange={setBPM} accentColor={accent} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <LoopControls
          bpm={bpm}
          currentTime={currentTime}
          loop={loop}
          onSetLoop={setLoop}
          onClearLoop={clearLoop}
          accentColor={accent}
        />
        <HotCues
          hotCues={hotCues}
          currentTime={currentTime}
          onSetHotCue={setHotCue}
          onSeek={handleSeek}
        />
      </div>
    </div>
  );
}

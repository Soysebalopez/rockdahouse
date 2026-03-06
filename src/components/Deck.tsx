'use client';

import { useCallback, useEffect, useRef } from 'react';
import YouTubePlayer from './YouTubePlayer';
import Waveform from './Waveform';
import JogWheel from './JogWheel';
import TransportControls from './TransportControls';
import BPMDisplay from './BPMDisplay';
import TrackInfo from './TrackInfo';
import LoopControls from './LoopControls';
import HotCues from './HotCues';
import FXControls from './FXControls';
import type { DeckId } from '@/lib/types';
import { getDeckStoreById } from '@/stores/useDeckStore';

interface DeckProps {
  id: DeckId;
  compact?: boolean;
}

const ACCENTS: Record<DeckId, string> = {
  A: 'var(--accent-a)',
  B: 'var(--accent-b)',
  C: 'var(--accent-c)',
  D: 'var(--accent-d)',
};

const ACCENT_HEX: Record<DeckId, string> = {
  A: '#ec4899',
  B: '#3b82f6',
  C: '#22c55e',
  D: '#f97316',
};

const DIM_HEX: Record<DeckId, string> = {
  A: '#9d174d',
  B: '#1e40af',
  C: '#15803d',
  D: '#c2410c',
};

export default function Deck({ id, compact }: DeckProps) {
  const store = getDeckStoreById(id);
  const {
    videoId, title, channel, duration, currentTime, isPlaying, volume,
    bpm, loop, hotCues,
    playerRef, setPlayerRef, setPlaying, setVolume, setBPM,
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

        const currentLoop = getDeckStoreById(id).getState().loop;
        if (currentLoop.active && currentLoop.end > 0 && t >= currentLoop.end) {
          playerRef.seekTo(currentLoop.start, true);
        }
      }, 50);
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
  const handleNudge = (seconds: number) => {
    if (!playerRef) return;
    const t = playerRef.getCurrentTime?.() ?? 0;
    playerRef.seekTo(Math.max(0, t + seconds), true);
  };
  const handleScratch = (delta: number) => {
    if (!playerRef) return;
    const t = playerRef.getCurrentTime?.() ?? 0;
    playerRef.seekTo(Math.max(0, t + delta), true);
  };

  return (
    <div
      className="flex flex-col gap-2.5 p-4 rounded-xl relative overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid var(--border-default)`,
        boxShadow: isPlaying ? `inset 0 0 30px ${ACCENT_HEX[id]}10, 0 0 20px ${ACCENT_HEX[id]}08` : 'none',
        transition: 'box-shadow 300ms ease',
      }}
    >
      {/* Deck header */}
      <div className="flex items-center gap-2">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: accent,
            boxShadow: isPlaying ? `0 0 8px ${ACCENT_HEX[id]}` : 'none',
            transition: 'box-shadow 300ms ease',
          }}
        />
        <span className="text-sm font-bold tracking-wide" style={{ color: accent }}>DECK {id}</span>
        {isPlaying && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: `${ACCENT_HEX[id]}30`, color: accent }}>
            LIVE
          </span>
        )}
      </div>

      {/* Player + Jog Wheel row */}
      <div className="flex gap-3 items-start">
        <div className="flex-1 flex flex-col gap-2">
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
        </div>
        <JogWheel
          isPlaying={isPlaying}
          currentTime={currentTime}
          onNudge={handleNudge}
          onScratch={handleScratch}
          accentColor={ACCENT_HEX[id]}
          size={130}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <TransportControls isPlaying={isPlaying} onPlay={handlePlay} onPause={handlePause} onStop={handleStop} accentColor={accent} />
        <div className="w-px h-8" style={{ background: 'var(--border-default)' }} />
        <BPMDisplay trackTitle={title} onBpmChange={setBPM} accentColor={accent} />
      </div>

      {/* Loop + Hot Cues row */}
      <div className="flex items-center gap-3 flex-wrap pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <LoopControls
          bpm={bpm}
          currentTime={currentTime}
          loop={loop}
          onSetLoop={setLoop}
          onClearLoop={clearLoop}
          accentColor={accent}
        />
        <div className="w-px h-6" style={{ background: 'var(--border-default)' }} />
        <HotCues
          hotCues={hotCues}
          currentTime={currentTime}
          onSetHotCue={setHotCue}
          onSeek={handleSeek}
        />
      </div>

      {/* FX row */}
      <div className="flex items-center gap-3 flex-wrap pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <FXControls deckId={id} accentColor={ACCENT_HEX[id]} />
      </div>
    </div>
  );
}

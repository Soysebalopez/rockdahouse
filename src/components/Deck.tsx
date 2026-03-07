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

const SUPPORTED_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function snapToRate(rate: number): number {
  let closest = SUPPORTED_RATES[0];
  let minDiff = Math.abs(rate - closest);
  for (const r of SUPPORTED_RATES) {
    const diff = Math.abs(rate - r);
    if (diff < minDiff) { minDiff = diff; closest = r; }
  }
  return closest;
}

function PitchControl({ rate, bpm, syncLocked, onRateChange, accentColor }: {
  rate: number;
  bpm: number | null;
  syncLocked: boolean;
  onRateChange: (rate: number) => void;
  accentColor: string;
}) {
  const effectiveBpm = bpm ? Math.round(bpm * rate) : null;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>PITCH</div>
      <input
        type="range"
        min={0}
        max={SUPPORTED_RATES.length - 1}
        step={1}
        value={SUPPORTED_RATES.indexOf(snapToRate(rate)) !== -1 ? SUPPORTED_RATES.indexOf(snapToRate(rate)) : 3}
        onChange={(e) => onRateChange(SUPPORTED_RATES[parseInt(e.target.value)])}
        disabled={syncLocked}
        className="w-20 h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-30"
        style={{
          background: `linear-gradient(to right, var(--bg-elevated), ${accentColor})`,
          accentColor: accentColor,
        }}
      />
      <div className="text-[10px] font-mono font-bold tabular-nums" style={{ color: rate === 1 ? 'var(--text-muted)' : accentColor }}>
        {rate === 1 ? '1x' : `\u00d7${rate}`}
      </div>
      {effectiveBpm && rate !== 1 && (
        <div className="text-[9px] font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {bpm} \u2192 {effectiveBpm}
        </div>
      )}
    </div>
  );
}

export default function Deck({ id, compact }: DeckProps) {
  const store = getDeckStoreById(id);
  const {
    videoId, title, channel, duration, currentTime, isPlaying, volume,
    bpm, playbackRate, syncLocked, loop, hotCues,
    playerRef, setPlayerRef, setPlaying, setVolume, setBPM,
    setPlaybackRate, setSyncLocked,
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
      className="flex flex-col gap-1.5 p-3 rounded-xl relative overflow-hidden"
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
      <div className="flex gap-2 items-start">
        <div className="flex-1 flex flex-col gap-1.5">
          <YouTubePlayer deckId={id} videoId={videoId} onReady={handleReady} onStateChange={handleStateChange} />
          <Waveform
            videoId={videoId}
            currentTime={currentTime}
            duration={duration}
            accentColor={ACCENT_HEX[id]}
            dimColor={DIM_HEX[id]}
            height={36}
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
          size={90}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        <TransportControls isPlaying={isPlaying} onPlay={handlePlay} onPause={handlePause} onStop={handleStop} accentColor={accent} />
        <div className="w-px h-8" style={{ background: 'var(--border-default)' }} />
        <BPMDisplay trackTitle={title} onBpmChange={setBPM} accentColor={accent} playbackRate={playbackRate} />
        <div className="w-px h-8" style={{ background: 'var(--border-default)' }} />
        {/* Pitch fader */}
        <PitchControl
          rate={playbackRate}
          bpm={bpm}
          syncLocked={syncLocked}
          onRateChange={setPlaybackRate}
          accentColor={accent}
        />
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

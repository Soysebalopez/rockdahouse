'use client';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  accentColor: string;
}

export default function TransportControls({ isPlaying, onPlay, onPause, onStop, accentColor }: TransportControlsProps) {
  const btnBase = "w-10 h-10 flex items-center justify-center rounded-lg text-base transition-colors duration-150";

  return (
    <div className="flex gap-2">
      <button
        onClick={isPlaying ? onPause : onPlay}
        className={btnBase}
        style={{
          background: isPlaying ? accentColor : 'var(--bg-elevated)',
          color: isPlaying ? '#fff' : 'var(--text-primary)',
        }}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button
        onClick={onStop}
        className={btnBase}
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
        title="Stop"
      >
        ⏹
      </button>
    </div>
  );
}

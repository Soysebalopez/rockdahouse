'use client';

interface TrackInfoProps {
  title: string;
  channel: string;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  accentColor: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function TrackInfo({ title, channel, currentTime, duration, onSeek, accentColor }: TrackInfoProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    onSeek(x * duration);
  };

  return (
    <div className="w-full">
      {title ? (
        <>
          <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {title.length > 45 ? title.slice(0, 45) + '...' : title}
          </div>
          <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{channel}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{formatTime(currentTime)}</span>
            <div
              className="flex-1 h-1.5 rounded-full cursor-pointer relative"
              style={{ background: 'var(--fader-track)' }}
              onClick={handleSeek}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{ width: `${progress}%`, background: accentColor }}
              />
            </div>
            <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{formatTime(duration)}</span>
          </div>
        </>
      ) : (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No track loaded</div>
      )}
    </div>
  );
}

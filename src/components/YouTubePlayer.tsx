'use client';

import { useEffect } from 'react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import type { DeckId } from '@/lib/types';

interface YouTubePlayerProps {
  deckId: DeckId;
  videoId: string | null;
  onReady: (player: YT.Player) => void;
  onStateChange: (state: number) => void;
}

export default function YouTubePlayer({ deckId, videoId, onReady, onStateChange }: YouTubePlayerProps) {
  const containerId = `yt-player-${deckId}`;
  const { isReady, loadVideo } = useYouTubePlayer({
    containerId,
    onReady,
    onStateChange,
  });

  useEffect(() => {
    if (isReady && videoId) {
      loadVideo(videoId);
    }
  }, [isReady, videoId, loadVideo]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/9', maxHeight: 200 }}>
      {!videoId && (
        <div className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Load a track to Deck {deckId}
          </span>
        </div>
      )}
      <div id={containerId} className="w-full h-full" />
    </div>
  );
}

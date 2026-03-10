import { useEffect } from 'react';
import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';
import { useMixerStore } from '@/stores/useMixerStore';
import { useSearchStore } from '@/stores/useSearchStore';
import { usePlaylistStore } from '@/stores/usePlaylistStore';
import type { DeckId } from '@/lib/types';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in search input
      if ((e.target as HTMLElement)?.hasAttribute('data-search-input')) return;

      const deckA = useDeckAStore.getState();
      const deckB = useDeckBStore.getState();
      const mixer = useMixerStore.getState();

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (deckA.isPlaying) deckA.playerRef?.pauseVideo();
          else deckA.playerRef?.playVideo();
          break;
        case 'Enter':
          e.preventDefault();
          if (deckB.isPlaying) deckB.playerRef?.pauseVideo();
          else deckB.playerRef?.playVideo();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          mixer.setCrossfaderPosition(Math.max(0, mixer.crossfaderPosition - 0.05));
          break;
        case 'ArrowRight':
          e.preventDefault();
          mixer.setCrossfaderPosition(Math.min(1, mixer.crossfaderPosition + 0.05));
          break;
        case 'ArrowUp':
          e.preventDefault();
          mixer.setMasterVolume(Math.min(1, mixer.masterVolume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          mixer.setMasterVolume(Math.max(0, mixer.masterVolume - 0.05));
          break;
        case 's':
        case 'S':
          useSearchStore.getState().toggleOpen();
          break;
        case 'p':
        case 'P':
          usePlaylistStore.getState().toggleOpen();
          break;
        case '1':
          mixer.toggleCue('A' as DeckId);
          break;
        case '2':
          mixer.toggleCue('B' as DeckId);
          break;
        case '3':
          mixer.toggleCue('C' as DeckId);
          break;
        case '4':
          mixer.toggleCue('D' as DeckId);
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

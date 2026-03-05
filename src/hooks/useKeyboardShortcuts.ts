import { useEffect } from 'react';
import { useDeckAStore, useDeckBStore } from '@/stores/useDeckStore';
import { useMixerStore } from '@/stores/useMixerStore';
import { useSearchStore } from '@/stores/useSearchStore';

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
        // EQ kills — Deck A
        case 'q': case 'Q':
          deckA.setEQ('high', deckA.eqHigh === -12 ? 0 : -12);
          break;
        case 'a':
          deckA.setEQ('mid', deckA.eqMid === -12 ? 0 : -12);
          break;
        case 'z': case 'Z':
          deckA.setEQ('low', deckA.eqLow === -12 ? 0 : -12);
          break;
        // EQ kills — Deck B
        case 'e': case 'E':
          deckB.setEQ('high', deckB.eqHigh === -12 ? 0 : -12);
          break;
        case 'd':
          deckB.setEQ('mid', deckB.eqMid === -12 ? 0 : -12);
          break;
        case 'c': case 'C':
          deckB.setEQ('low', deckB.eqLow === -12 ? 0 : -12);
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

import type { DeckId } from './types';

/**
 * Shared registry of HTMLAudioElements for direct audio routing.
 * Written by useAudioRouting hook, read by Console.tsx rAF loop.
 */
const audioElements: Record<string, HTMLAudioElement | null> = {};

export function setAudioElement(deckId: DeckId, el: HTMLAudioElement | null) {
  audioElements[deckId] = el;
}

export function getAudioElement(deckId: DeckId): HTMLAudioElement | null {
  return audioElements[deckId] ?? null;
}

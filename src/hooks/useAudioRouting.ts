'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { DeckId } from '@/lib/types';
import { getDeckStoreById } from '@/stores/useDeckStore';
import { useAudioConfigStore } from '@/stores/useAudioConfigStore';
import { useMixerStore } from '@/stores/useMixerStore';
import { setAudioElement } from '@/lib/audioElements';

/**
 * Per-deck hook that manages an HTMLAudioElement for real audio routing.
 * Fetches audio URL via yt-dlp, creates Audio element, syncs with iframe,
 * and uses setSinkId() for device routing.
 * Falls back to iframe audio if yt-dlp is unavailable.
 */
export function useAudioRouting(deckId: DeckId) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  const store = getDeckStoreById(deckId);

  // Fetch audio URL when videoId changes
  useEffect(() => {
    const { videoId } = store.getState();
    if (!videoId) {
      cleanup();
      return;
    }

    // Abort previous fetch
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetchAndSetup(videoId, controller.signal);

    return () => {
      controller.abort();
      cleanup();
    };
  // Re-run when videoId changes - subscribe to store
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store().videoId]);

  function cleanup() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      setAudioElement(deckId, null);
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = undefined;
    }
    const s = store.getState();
    if (s.useDirectAudio) {
      s.setUseDirectAudio(false);
      s.setAudioReady(false);
      s.setAudioUrl(null);
      // Unmute iframe
      s.playerRef?.unMute();
    }
  }

  async function fetchAndSetup(videoId: string, signal: AbortSignal) {
    try {
      const res = await fetch(`/api/audio-url?videoId=${videoId}`, { signal });
      const data = await res.json();

      if (signal.aborted) return;

      if (data.fallback || !data.url) {
        console.log(`[audio-routing] Deck ${deckId}: fallback mode (yt-dlp unavailable)`);
        return; // Stay with iframe audio
      }

      // Create HTMLAudioElement
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.src = data.url;

      // Route to correct device
      await routeToDevice(audio);

      audio.addEventListener('canplaythrough', () => {
        if (signal.aborted) return;
        audioRef.current = audio;
        setAudioElement(deckId, audio);
        const state = store.getState();
        state.setAudioUrl(data.url);
        state.setAudioReady(true);
        state.setUseDirectAudio(true);

        // Mute the YouTube iframe (we handle audio now)
        state.playerRef?.mute();

        // If already playing, start audio
        if (state.isPlaying) {
          syncAudioToIframe();
          audio.play().catch(() => {});
        }

        // Start drift correction
        startSyncLoop();

        console.log(`[audio-routing] Deck ${deckId}: direct audio ready`);
      }, { once: true });

      audio.addEventListener('error', () => {
        if (signal.aborted) return;
        console.warn(`[audio-routing] Deck ${deckId}: audio element error, falling back`);
        cleanup();
      });

    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.warn(`[audio-routing] Deck ${deckId}: fetch failed, using iframe audio`);
    }
  }

  async function routeToDevice(audio: HTMLAudioElement) {
    if (!('setSinkId' in audio)) return;

    const audioConfig = useAudioConfigStore.getState();
    const mixer = useMixerStore.getState();
    const isCued = mixer.cueTargets[deckId];

    const deviceId = isCued && audioConfig.outputMode !== 'speakers'
      ? audioConfig.headphoneDeviceId
      : audioConfig.masterDeviceId;

    if (deviceId && deviceId !== 'default') {
      try {
        await (audio as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(deviceId);
      } catch (err) {
        console.warn(`[audio-routing] Deck ${deckId}: setSinkId failed:`, err);
      }
    }
  }

  function syncAudioToIframe() {
    const audio = audioRef.current;
    const { playerRef, playbackRate } = store.getState();
    if (!audio || !playerRef) return;

    const iframeTime = playerRef.getCurrentTime?.() ?? 0;
    audio.currentTime = iframeTime;
    audio.playbackRate = playbackRate;
  }

  function startSyncLoop() {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);

    syncIntervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      const { playerRef, isPlaying, playbackRate, useDirectAudio } = store.getState();
      if (!audio || !playerRef || !useDirectAudio) return;

      // Sync playback rate
      if (audio.playbackRate !== playbackRate) {
        audio.playbackRate = playbackRate;
      }

      // Sync play/pause state
      if (isPlaying && audio.paused) {
        audio.play().catch(() => {});
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }

      // Drift correction
      if (isPlaying) {
        const iframeTime = playerRef.getCurrentTime?.() ?? 0;
        const drift = Math.abs(audio.currentTime - iframeTime);
        if (drift > 0.3) {
          audio.currentTime = iframeTime;
        }
      }

      // Re-route if CUE state changed
      routeToDevice(audio);
    }, 500);
  }

  // Expose sync function for transport controls
  const syncPlayState = useCallback((playing: boolean) => {
    const audio = audioRef.current;
    if (!audio || !store.getState().useDirectAudio) return;

    if (playing) {
      syncAudioToIframe();
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || !store.getState().useDirectAudio) return;
    audio.currentTime = time;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { audioRef, syncPlayState, syncSeek };
}

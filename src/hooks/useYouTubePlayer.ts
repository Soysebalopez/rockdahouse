import { useEffect, useRef, useCallback, useState } from 'react';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI() {
  if (apiLoaded) return;
  apiLoaded = true;

  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(script);

  window.onYouTubeIframeAPIReady = () => {
    apiReady = true;
    readyCallbacks.forEach((cb) => cb());
    readyCallbacks.length = 0;
  };
}

function onAPIReady(cb: () => void) {
  if (apiReady) {
    cb();
  } else {
    readyCallbacks.push(cb);
    loadYouTubeAPI();
  }
}

interface UseYouTubePlayerOptions {
  containerId: string;
  onStateChange?: (state: number) => void;
  onReady?: (player: YT.Player) => void;
}

export function useYouTubePlayer({ containerId, onStateChange, onReady }: UseYouTubePlayerOptions) {
  const playerRef = useRef<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onAPIReady(() => {
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(containerId, {
        height: '100%',
        width: '100%',
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            setIsReady(true);
            onReady?.(e.target);
          },
          onStateChange: (e) => {
            onStateChange?.(e.data);
          },
        },
      });
    });

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // Only run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  const loadVideo = useCallback((videoId: string) => {
    playerRef.current?.loadVideoById(videoId);
  }, []);

  const play = useCallback(() => { playerRef.current?.playVideo(); }, []);
  const pause = useCallback(() => { playerRef.current?.pauseVideo(); }, []);
  const stop = useCallback(() => {
    playerRef.current?.pauseVideo();
    playerRef.current?.seekTo(0, true);
  }, []);
  const seekTo = useCallback((seconds: number) => { playerRef.current?.seekTo(seconds, true); }, []);
  const setVolume = useCallback((vol: number) => { playerRef.current?.setVolume(vol * 100); }, []);
  const getCurrentTime = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, []);
  const getDuration = useCallback(() => playerRef.current?.getDuration() ?? 0, []);

  return { player: playerRef, isReady, loadVideo, play, pause, stop, seekTo, setVolume, getCurrentTime, getDuration };
}

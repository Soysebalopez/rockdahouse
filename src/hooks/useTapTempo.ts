import { useCallback, useRef, useState } from 'react';

const MAX_TAPS = 8;
const RESET_TIMEOUT = 5000;

export function useTapTempo() {
  const [bpm, setBpm] = useState<number | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const tapsRef = useRef<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const tap = useCallback(() => {
    const now = Date.now();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      tapsRef.current = [];
      // Don't reset BPM on timeout — keep the last calculated value
      // User can manually reset via the reset() function
      setTapCount(0);
    }, RESET_TIMEOUT);

    tapsRef.current.push(now);

    if (tapsRef.current.length > MAX_TAPS) {
      tapsRef.current = tapsRef.current.slice(-MAX_TAPS);
    }

    setTapCount(tapsRef.current.length);

    if (tapsRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapsRef.current.length; i++) {
        intervals.push(tapsRef.current[i] - tapsRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      setBpm(Math.min(300, Math.max(20, calculatedBpm)));
    }
  }, []);

  const reset = useCallback(() => {
    tapsRef.current = [];
    setBpm(null);
    setTapCount(0);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { bpm, tap, reset, tapCount };
}

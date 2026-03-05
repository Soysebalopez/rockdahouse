import { useCallback, useRef, useState } from 'react';

const MAX_TAPS = 8;
const RESET_TIMEOUT = 3000;

export function useTapTempo() {
  const [bpm, setBpm] = useState<number | null>(null);
  const tapsRef = useRef<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const tap = useCallback(() => {
    const now = Date.now();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      tapsRef.current = [];
      setBpm(null);
    }, RESET_TIMEOUT);

    tapsRef.current.push(now);

    if (tapsRef.current.length > MAX_TAPS) {
      tapsRef.current = tapsRef.current.slice(-MAX_TAPS);
    }

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
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { bpm, tap, reset };
}

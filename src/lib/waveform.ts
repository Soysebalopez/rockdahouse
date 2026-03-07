/**
 * Deterministic PRNG-based waveform data generator.
 * Seeded by videoId so each track always produces the same visual waveform.
 */
export function generateWaveformData(seed: string, bars: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }

  const data: number[] = [];
  for (let i = 0; i < bars; i++) {
    hash = ((hash * 1103515245 + 12345) & 0x7fffffff);
    const base = (hash % 1000) / 1000;
    const position = i / bars;
    const envelope = Math.sin(position * Math.PI) * 0.5 + 0.5;
    const section = Math.sin(position * Math.PI * 6) * 0.15;
    data.push(Math.max(0.08, Math.min(1, base * 0.6 * envelope + section + 0.2)));
  }
  return data;
}

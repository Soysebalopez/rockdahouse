export type DeckId = 'A' | 'B' | 'C' | 'D';

export interface Track {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  bpm?: number | null;
  definition?: 'hd' | 'sd';
}

export type CrossfaderCurve = 'linear' | 'equalPower' | 'cut';

export interface DeckState {
  videoId: string | null;
  title: string;
  channel: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  bpm: number | null;
  playerRef: YT.Player | null;
}

export interface MixerState {
  crossfaderPosition: number;
  crossfaderCurve: CrossfaderCurve;
  masterVolume: number;
  vuLevelA: number;
  vuLevelB: number;
  vuLevelMaster: number;
}

export interface SearchState {
  query: string;
  results: Track[];
  loading: boolean;
  error: string | null;
}

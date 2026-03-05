import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from '@/lib/types';

interface PlaylistState {
  tracks: Track[];
  isOpen: boolean;
}

interface PlaylistActions {
  addTrack: (track: Track) => void;
  removeTrack: (videoId: string) => void;
  moveTrack: (fromIndex: number, toIndex: number) => void;
  clearPlaylist: () => void;
  toggleOpen: () => void;
}

export const usePlaylistStore = create<PlaylistState & PlaylistActions>()(
  persist(
    (set) => ({
      tracks: [],
      isOpen: false,

      addTrack: (track) => set((s) => {
        if (s.tracks.some((t) => t.videoId === track.videoId)) return s;
        return { tracks: [...s.tracks, track] };
      }),
      removeTrack: (videoId) => set((s) => ({
        tracks: s.tracks.filter((t) => t.videoId !== videoId),
      })),
      moveTrack: (fromIndex, toIndex) => set((s) => {
        const tracks = [...s.tracks];
        const [moved] = tracks.splice(fromIndex, 1);
        tracks.splice(toIndex, 0, moved);
        return { tracks };
      }),
      clearPlaylist: () => set({ tracks: [] }),
      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    { name: 'rockdahouse-playlist' }
  )
);

// Zustand store for playback state
import { create } from 'zustand';

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;  // milliseconds
  playbackRate: number;
  duration: number;

  // Actions
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  updateCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1.0,
  duration: 0,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  seek: (time: number) => set({ currentTime: time, isPlaying: false }),
  setPlaybackRate: (rate: number) => set({ playbackRate: rate }),
  updateCurrentTime: (time: number) => set({ currentTime: time }),
  setDuration: (duration: number) => set({ duration }),
}));
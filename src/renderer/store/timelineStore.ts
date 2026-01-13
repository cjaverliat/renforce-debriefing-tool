// Zustand store for timeline viewport
import { create } from 'zustand';

interface TimelineState {
  // Viewport
  viewportStart: number;  // milliseconds
  viewportEnd: number;    // milliseconds
  pixelsPerMs: number;    // zoom level

  // Selection
  selectedTrackIds: string[];

  // Actions
  setViewport: (start: number, end: number) => void;
  zoom: (factor: number, centerTime?: number) => void;
  pan: (deltaMs: number) => void;
  selectTrack: (trackId: string) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  viewportStart: 0,
  viewportEnd: 10000,  // 10 seconds initially
  pixelsPerMs: 0.1,
  selectedTrackIds: [],

  setViewport: (start, end) => {
    const duration = end - start;
    const pixelsPerMs = 1000 / duration; // Assuming 1000px wide viewport
    set({ viewportStart: start, viewportEnd: end, pixelsPerMs });
  },

  zoom: (factor, centerTime) => {
    const state = get();
    const center = centerTime ?? (state.viewportStart + state.viewportEnd) / 2;
    const currentSpan = state.viewportEnd - state.viewportStart;
    const newSpan = currentSpan / factor;

    set({
      viewportStart: center - newSpan / 2,
      viewportEnd: center + newSpan / 2,
      pixelsPerMs: state.pixelsPerMs * factor,
    });
  },

  pan: (deltaMs) =>
    set((state) => ({
      viewportStart: state.viewportStart + deltaMs,
      viewportEnd: state.viewportEnd + deltaMs,
    })),

  selectTrack: (trackId) => set({ selectedTrackIds: [trackId] }),
}));
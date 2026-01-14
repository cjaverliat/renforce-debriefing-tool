/**
 * Playback synchronization state.
 *
 * Instead of passing a continuously-updated currentTime, we pass an anchor-based
 * state that allows children to compute the derived currentTime themselves.
 *
 * currentTime = anchorTime + (isPlaying ? (now - anchorTimestamp) * speed / 1000 : 0)
 */
export interface PlaybackState {
  /** The media time (in seconds) at the anchor point */
  anchorTime: number;
  /** Real-world timestamp (performance.now()) when the anchor was set */
  anchorTimestamp: number;
  /** Playback speed multiplier (1.0 = normal speed) */
  speed: number;
  /** Whether playback is currently active */
  isPlaying: boolean;
}

/**
 * Computes the current playback time from a PlaybackState.
 *
 * @param state - The playback state
 * @param now - Current timestamp (defaults to performance.now())
 * @returns The computed current time in seconds
 */
export function computeCurrentTime(state: PlaybackState, now?: number): number {
  const timestamp = now ?? performance.now();

  if (!state.isPlaying) {
    return state.anchorTime;
  }

  const elapsed = (timestamp - state.anchorTimestamp) / 1000;
  return state.anchorTime + elapsed * state.speed;
}

/**
 * Creates a new PlaybackState with updated anchor for a seek operation.
 */
export function seekTo(time: number): PlaybackState {
  return {
    anchorTime: time,
    anchorTimestamp: performance.now(),
    speed: 1.0,
    isPlaying: false,
  };
}

/**
 * Creates an initial PlaybackState.
 */
export function createInitialPlaybackState(): PlaybackState {
  return {
    anchorTime: 0,
    anchorTimestamp: performance.now(),
    speed: 1.0,
    isPlaying: false,
  };
}

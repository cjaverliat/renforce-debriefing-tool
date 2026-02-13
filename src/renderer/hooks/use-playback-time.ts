import { useState, useEffect, useCallback, useRef } from 'react';
import { type PlaybackState, computeCurrentTime } from '@/shared/types/playback';

interface UsePlaybackTimeOptions {
  /** Update interval in milliseconds (default: 16ms ~60fps) */
  updateInterval?: number;
  /** Maximum time value (duration) to clamp to */
  maxTime?: number;
}

/**
 * Hook that computes and continuously updates the current playback time
 * from a PlaybackState.
 *
 * @param playbackState - The anchor-based playback state
 * @param options - Configuration options
 * @returns The computed current time in seconds
 */
export function usePlaybackTime(
  playbackState: PlaybackState,
  options: UsePlaybackTimeOptions = {}
): number {
  const { updateInterval = 16, maxTime } = options;
  const [currentTime, setCurrentTime] = useState(() =>
    computeCurrentTime(playbackState)
  );
  const animationFrameRef = useRef<number>(null);
  const playbackStateRef = useRef(playbackState);
  const maxTimeRef = useRef(maxTime);

  // Keep refs updated
  playbackStateRef.current = playbackState;
  maxTimeRef.current = maxTime;

  const updateTime = useCallback(() => {
    let time = computeCurrentTime(playbackStateRef.current);

    // Clamp to max time if provided
    if (maxTimeRef.current !== undefined && time > maxTimeRef.current) {
      time = maxTimeRef.current;
    }

    setCurrentTime(time);
  }, []);

  // Update immediately when anchor values change (seek events)
  useEffect(() => {
    updateTime();
  }, [playbackState.anchorTime, playbackState.anchorTimestamp, updateTime]);

  // Handle animation frame for playback
  useEffect(() => {
    if (!playbackState.isPlaying) {
      return;
    }

    // Use requestAnimationFrame for smooth updates during playback
    let lastUpdate = performance.now();

    const tick = () => {
      const now = performance.now();
      if (now - lastUpdate >= updateInterval) {
        updateTime();
        lastUpdate = now;
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackState.isPlaying, updateInterval, updateTime]);

  return currentTime;
}

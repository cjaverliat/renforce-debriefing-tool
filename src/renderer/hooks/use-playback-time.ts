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

  const updateTime = useCallback(() => {
    let time = computeCurrentTime(playbackState);

    // Clamp to max time if provided
    if (maxTime !== undefined && time > maxTime) {
      time = maxTime;
    }

    setCurrentTime(time);
  }, [playbackState, maxTime]);

  useEffect(() => {
    // Immediately compute when state changes
    updateTime();

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
  }, [playbackState, updateInterval, updateTime]);

  return currentTime;
}

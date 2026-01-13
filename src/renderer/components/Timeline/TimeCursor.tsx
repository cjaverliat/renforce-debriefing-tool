// Time cursor component
import React from 'react';
import { usePlaybackStore } from '../../store/playbackStore';
import { useTimelineStore } from '../../store/timelineStore';

export function TimeCursor() {
  const currentTime = usePlaybackStore((state) => state.currentTime);
  const { viewportStart, viewportEnd } = useTimelineStore();

  // Calculate cursor position
  const viewportDuration = viewportEnd - viewportStart;
  const relativeTime = currentTime - viewportStart;
  const leftPercent = (relativeTime / viewportDuration) * 100;

  // Don't render if outside viewport
  if (currentTime < viewportStart || currentTime > viewportEnd) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${leftPercent}%`,
        top: 0,
        bottom: 0,
        width: '2px',
        backgroundColor: 'red',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}

// Timeline container component
import React, { useRef, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import type { Track } from '../../../shared/types/ipc';

interface TimelineProps {
  tracks: Track[];
  duration: number;
}

export function Timeline({ tracks, duration }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewportStart, viewportEnd, zoom, setViewport } = useTimelineStore();

  // Initialize viewport
  useEffect(() => {
    setViewport(0, duration);
  }, [duration, setViewport]);

  // Zoom with Ctrl+wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      zoom(factor);
    }
  };

  return (
    <div ref={containerRef} onWheel={handleWheel} style={{ height: '100%' }}>
      <div>Timeline: {tracks.length} tracks</div>
      <div>Viewport: {viewportStart}ms - {viewportEnd}ms</div>
      {/* TODO: Add TimeRuler, TrackListPanel, TimelineCanvas, TimeCursor */}
    </div>
  );
}
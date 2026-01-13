// Timeline canvas component
import React, { useRef, useEffect } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import type { Track } from '../../../shared/types/ipc';

interface TimelineCanvasProps {
  tracks: Track[];
}

export function TimelineCanvas({ tracks }: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { viewportStart, viewportEnd } = useTimelineStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // TODO: Implement canvas rendering
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Placeholder: Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [tracks, viewportStart, viewportEnd]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ display: 'block' }}
    />
  );
}
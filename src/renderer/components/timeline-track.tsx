import { useRef, useEffect, useState, type ReactNode } from 'react';
import type { PlaybackState } from '@/shared/types/playback.ts';
import { usePlaybackTime } from '@/renderer/hooks/use-playback-time.ts';

interface TimelineTrackProps {
  contentSlot: ReactNode;
  duration: number;
  playbackState: PlaybackState;
  pixelsPerSecond: number;
}

export function TimelineTrack({
  contentSlot,
  duration,
  playbackState,
  pixelsPerSecond,
}: TimelineTrackProps) {
  const playheadCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const playbackTime = usePlaybackTime(playbackState, { maxTime: duration });

  // Track container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw playhead (overlay) - updates frequently
  useEffect(() => {
    const canvas = playheadCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    // Clear canvas (transparent)
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw playhead
    const playheadX = playbackTime * pixelsPerSecond;

    if (playheadX >= 0 && playheadX <= rect.width) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, rect.height);
      ctx.stroke();
    }
  }, [duration, playbackTime, pixelsPerSecond, containerSize]);

  return (
    <div ref={containerRef} className="relative border-b border-zinc-800">
      {contentSlot}
      <canvas
        ref={playheadCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}

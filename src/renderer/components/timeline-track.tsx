import { useRef, useEffect, useState, type ReactNode } from 'react';
import type { PlaybackState } from '@/shared/types/playback.ts';
import { usePlaybackTime } from '@/renderer/hooks/use-playback-time.ts';

interface TimelineTrackProps {
  labelSlot: ReactNode;
  contentSlot: ReactNode;
  duration: number;
  playbackState: PlaybackState;
  zoom: number;
  scrollOffset: number;
}

export function TimelineTrack({
  labelSlot,
  contentSlot,
  duration,
  playbackState,
  zoom,
  scrollOffset,
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
    const pixelsPerSecond = (rect.width / duration) * zoom;
    const startTime = scrollOffset / pixelsPerSecond;
    const playheadX = (playbackTime - startTime) * pixelsPerSecond;

    if (playheadX >= 0 && playheadX <= rect.width) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, rect.height);
      ctx.stroke();
    }
  }, [duration, playbackTime, zoom, scrollOffset, containerSize]);

  return (
    <div className="flex border-b border-zinc-800">
      <div className="w-32 shrink-0 bg-zinc-900 border-r border-zinc-800 px-3 py-2 flex items-center sticky left-0 z-10">
        {labelSlot}
      </div>
      <div ref={containerRef} className="flex-1 relative">
        {contentSlot}
        <canvas
          ref={playheadCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>
    </div>
  );
}

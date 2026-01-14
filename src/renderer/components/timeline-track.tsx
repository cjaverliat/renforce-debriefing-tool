import { useRef, useEffect, useState } from 'react';
import type {PlaybackState} from "@/shared/types/playback.ts";
import {usePlaybackTime} from "@/renderer/hooks/use-playback-time.ts";

interface TimelineTrackProps {
  label: string;
  type: 'signal' | 'markers';
  data?: number[];
  markers?: Array<{ time: number; label: string; color: string }>;
  duration: number;
  playbackState: PlaybackState;
  zoom: number;
  scrollOffset: number;
  color?: string;
}

export function TimelineTrack({
  label,
  type,
  data,
  markers,
  duration,
  playbackState,
  zoom,
  scrollOffset,
  color = '#3b82f6',
}: TimelineTrackProps) {
  const signalCanvasRef = useRef<HTMLCanvasElement>(null);
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

  // Draw signals/markers (static content) - only when data changes
  useEffect(() => {
    const canvas = signalCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (type === 'signal' && data) {
      // Draw signal waveform
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const pixelsPerSecond = (rect.width / duration) * zoom;
      const startTime = scrollOffset / pixelsPerSecond;
      const endTime = startTime + (rect.width / pixelsPerSecond);

      const startIndex = Math.floor((startTime / duration) * data.length);
      const endIndex = Math.ceil((endTime / duration) * data.length);
      const visibleData = data.slice(startIndex, endIndex);

      visibleData.forEach((value, index) => {
        const x = (index / visibleData.length) * rect.width;
        const y = rect.height / 2 + (value * rect.height / 4);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    } else if (type === 'markers' && markers) {
      // Draw markers
      const pixelsPerSecond = (rect.width / duration) * zoom;
      const startTime = scrollOffset / pixelsPerSecond;

      markers.forEach((marker) => {
        const x = (marker.time - startTime) * pixelsPerSecond;

        if (x >= 0 && x <= rect.width) {
          // Draw marker line
          ctx.strokeStyle = marker.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, rect.height);
          ctx.stroke();

          // Draw marker label
          ctx.fillStyle = marker.color;
          ctx.font = '10px sans-serif';
          ctx.fillText(marker.label, x + 4, 14);
        }
      });
    }
  }, [data, markers, duration, zoom, scrollOffset, color, type, containerSize]);

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
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <div ref={containerRef} className="flex-1 relative">
        <canvas
          ref={signalCanvasRef}
          className="inset-0 w-full h-16"
          style={{ width: '100%', height: '64px' }}
        />
        <canvas
          ref={playheadCanvasRef}
          className="absolute inset-0 w-full h-16 pointer-events-none"
          style={{ width: '100%', height: '64px' }}
        />
      </div>
    </div>
  );
}

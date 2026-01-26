import { useRef, useState, useEffect, useMemo } from 'react';
import { TimelineControls } from '@/renderer/components/timeline-controls';
import { TimelineRuler } from '@/renderer/components/timeline-ruler';
import { TimelineTrack } from '@/renderer/components/timeline-track';
import type { Annotation } from '@/renderer/components/annotations-panel';
import type { PlaybackState } from '@/shared/types/playback';
import { usePlaybackTime } from '@/renderer/hooks/use-playback-time';
import { computeCurrentTime } from "@/shared/types/playback";

// Generate mock physiological data once at module load
function generateSignalData(duration: number, frequency: number, amplitude: number, samples = 1000) {
  return Array.from({ length: samples }, (_, i) => {
    const time = (i / samples) * duration;
    const value = Math.sin((i / samples) * frequency * 100) * amplitude;
    return { time, value };
  });
}

const MOCK_DURATION = 60 * 10; // seconds
const MOCK_HEART_RATE_DATA = generateSignalData(MOCK_DURATION, 2, 0.8);
const MOCK_RESPIRATION_DATA = generateSignalData(MOCK_DURATION, 0.5, 0.6);
const MOCK_SKIN_CONDUCTANCE_DATA = generateSignalData(MOCK_DURATION, 0.3, 0.4);

const SYSTEM_MARKERS = [
  { time: 15, label: 'Start', color: '#22c55e' },
  { time: 45, label: 'Phase 2', color: '#eab308' },
  { time: 90, label: 'Phase 3', color: '#f59e0b' },
  { time: 120, label: 'End', color: '#a855f7' },
];

// Signal track content component
interface SignalContentProps {
  data: Array<{ time: number; value: number }>;
  duration: number;
  zoom: number;
  scrollOffset: number;
  color: string;
}

function SignalContent({ data, duration, zoom, scrollOffset, color }: SignalContentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    const canvas = canvasRef.current;
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

    // Draw signal waveform
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    // Calculate visible time range
    const pixelsPerSecond = (rect.width / duration) * zoom;
    const startTime = scrollOffset / pixelsPerSecond;
    const endTime = startTime + (rect.width / pixelsPerSecond);

    // Filter to visible samples and draw at correct positions
    let isFirstPoint = true;
    for (const sample of data) {
      // Skip samples outside visible range (with small margin)
      if (sample.time < startTime - 1 || sample.time > endTime + 1) continue;

      const x = (sample.time - startTime) * pixelsPerSecond;
      const y = rect.height / 2 + (sample.value * rect.height / 4);

      if (isFirstPoint) {
        ctx.moveTo(x, y);
        isFirstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [data, duration, zoom, scrollOffset, color, containerSize]);

  return (
    <div ref={containerRef} className="w-full h-16">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}

// Marker track content component
interface MarkerContentProps {
  markers: Array<{ time: number; label: string; color: string }>;
  duration: number;
  zoom: number;
  scrollOffset: number;
}

function MarkerContent({ markers, duration, zoom, scrollOffset }: MarkerContentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    const canvas = canvasRef.current;
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
  }, [markers, duration, zoom, scrollOffset, containerSize]);

  return (
    <div ref={containerRef} className="w-full h-16">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}

interface TimelineProps {
  playbackState: PlaybackState;
  duration: number;
  annotations: Annotation[];
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

export function Timeline({
  playbackState,
  duration,
  annotations,
  onPlayPause,
  onSeek,
}: TimelineProps) {
  const { isPlaying } = playbackState;
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);

  const playbackTime = usePlaybackTime(playbackState, { maxTime: duration });

  // Combine system markers with user annotations
  const allMarkers = useMemo(() => [
    ...SYSTEM_MARKERS,
    ...annotations.map(a => ({
      time: a.time,
      label: a.label,
      color: a.color,
    })),
  ], [annotations]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.5, 0.5));
  };

  const handleSkipBackward = () => {
    onSeek(Math.max(0, playbackTime - 5));
  };

  const handleSkipForward = () => {
    onSeek(Math.min(duration, playbackTime + 5));
  };

  // Measure scrollbar width
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollbarWidth = () => {
      // Calculate scrollbar width (offsetWidth - clientWidth)
      const width = container.offsetWidth - container.clientWidth;
      setScrollbarWidth(width);
    };

    // Initial measurement
    updateScrollbarWidth();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateScrollbarWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const rulerContainer = rulerScrollRef.current;
    if (!container || !rulerContainer) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      setScrollOffset(scrollLeft);
      // Sync ruler scroll with tracks scroll
      rulerContainer.scrollLeft = scrollLeft;
    };

    const handleRulerScroll = () => {
      const scrollLeft = rulerContainer.scrollLeft;
      setScrollOffset(scrollLeft);
      // Sync tracks scroll with ruler scroll
      container.scrollLeft = scrollLeft;
    };

    container.addEventListener('scroll', handleScroll);
    rulerContainer.addEventListener('scroll', handleRulerScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      rulerContainer.removeEventListener('scroll', handleRulerScroll);
    };
  }, []);

  // Auto-scroll to follow playhead
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isPlaying) return;

    const containerWidth = container.clientWidth;
    const totalWidth = containerWidth * zoom;
    const pixelsPerSecond = totalWidth / duration;
    const playheadPosition = playbackTime * pixelsPerSecond;

    // Keep playhead in center third of viewport
    const targetScroll = playheadPosition - containerWidth / 2;
    if (targetScroll > scrollOffset + containerWidth * 0.66 || targetScroll < scrollOffset - containerWidth * 0.33) {
      container.scrollLeft = targetScroll;
    }
  }, [playbackTime, isPlaying, zoom, duration, scrollOffset]);

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      <TimelineControls
        isPlaying={isPlaying}
        playbackState={playbackState}
        duration={duration}
        zoom={zoom}
        onPlayPause={onPlayPause}
        onSkipBackward={handleSkipBackward}
        onSkipForward={handleSkipForward}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      {/* Sticky Ruler - scrolls horizontally only */}
      <div
        ref={rulerScrollRef}
        className="overflow-x-auto overflow-y-hidden scrollbar-hidden bg-zinc-800"
        style={{ paddingRight: `${scrollbarWidth}px` }}
      >
        <div style={{ width: `${zoom * 100}%`, minWidth: '100%' }}>
          <TimelineRuler
            duration={duration}
            playbackState={playbackState}
            zoom={zoom}
            scrollOffset={scrollOffset}
            onSeek={onSeek}
          />
        </div>
      </div>

      {/* Tracks - scrolls both horizontally and vertically */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar"
      >
        <div style={{ width: `${zoom * 100}%`, minWidth: '100%' }}>

          <TimelineTrack
              labelSlot={<span className="text-xs text-zinc-400">Markers</span>}
              contentSlot={
                <MarkerContent
                    markers={allMarkers}
                    duration={duration}
                    zoom={zoom}
                    scrollOffset={scrollOffset}
                />
              }
              duration={duration}
              playbackState={playbackState}
              zoom={zoom}
              scrollOffset={scrollOffset}
          />

          <TimelineTrack
            labelSlot={<span className="text-xs text-zinc-400">Heart Rate</span>}
            contentSlot={
              <SignalContent
                data={MOCK_HEART_RATE_DATA}
                duration={duration}
                zoom={zoom}
                scrollOffset={scrollOffset}
                color="#ef4444"
              />
            }
            duration={duration}
            playbackState={playbackState}
            zoom={zoom}
            scrollOffset={scrollOffset}
          />

          <TimelineTrack
            labelSlot={<span className="text-xs text-zinc-400">Respiration</span>}
            contentSlot={
              <SignalContent
                data={MOCK_RESPIRATION_DATA}
                duration={duration}
                zoom={zoom}
                scrollOffset={scrollOffset}
                color="#3b82f6"
              />
            }
            duration={duration}
            playbackState={playbackState}
            zoom={zoom}
            scrollOffset={scrollOffset}
          />

          <TimelineTrack
            labelSlot={<span className="text-xs text-zinc-400">Skin Conductance</span>}
            contentSlot={
              <SignalContent
                data={MOCK_SKIN_CONDUCTANCE_DATA}
                duration={duration}
                zoom={zoom}
                scrollOffset={scrollOffset}
                color="#22c55e"
              />
            }
            duration={duration}
            playbackState={playbackState}
            zoom={zoom}
            scrollOffset={scrollOffset}
          />
        </div>
      </div>
    </div>
  );
}
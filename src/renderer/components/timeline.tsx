import { useRef, useState, useEffect, useMemo } from 'react';
import { TimelineControls } from '@/renderer/components/timeline-controls';
import { TimelineRuler } from '@/renderer/components/timeline-ruler';
import { TimelineTrack } from '@/renderer/components/timeline-track';
import type { Annotation } from '@/renderer/components/annotations-panel';
import type { PlaybackState } from '@/shared/types/playback';
import { usePlaybackTime } from '@/renderer/hooks/use-playback-time';

// Generate mock physiological data once at module load
function generateSignalData(frequency: number, amplitude: number, samples = 1000) {
  return Array.from({ length: samples }, (_, i) => {
    const t = i / samples;
    return Math.sin(t * frequency * 100) * amplitude;
  });
}

const MOCK_HEART_RATE_DATA = generateSignalData(2, 0.8);
const MOCK_RESPIRATION_DATA = generateSignalData(0.5, 0.6);
const MOCK_SKIN_CONDUCTANCE_DATA = generateSignalData(0.3, 0.4);

const SYSTEM_MARKERS = [
  { time: 15, label: 'Start', color: '#22c55e' },
  { time: 45, label: 'Phase 2', color: '#eab308' },
  { time: 90, label: 'Phase 3', color: '#f59e0b' },
  { time: 120, label: 'End', color: '#a855f7' },
];

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
        currentTime={playbackTime}
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
            currentTime={playbackTime}
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
            label="Heart Rate"
            type="signal"
            data={MOCK_HEART_RATE_DATA}
            duration={duration}
            playbackState={playbackState}
            zoom={zoom}
            scrollOffset={scrollOffset}
            color="#ef4444"
          />

          <TimelineTrack
            label="Respiration"
            type="signal"
            data={MOCK_RESPIRATION_DATA}
            duration={duration}
            playbackState={playbackState}
            zoom={zoom}
            scrollOffset={scrollOffset}
            color="#3b82f6"
          />

          <TimelineTrack
            label="Skin Conductance"
            type="signal"
            data={MOCK_SKIN_CONDUCTANCE_DATA}
            duration={duration}
            playbackState={playbackState}
            zoom={zoom}
            scrollOffset={scrollOffset}
            color="#22c55e"
          />

          <TimelineTrack
            label="Markers"
            type="markers"
            markers={allMarkers}
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
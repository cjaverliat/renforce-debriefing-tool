import { useRef, useState, useEffect } from 'react';
import { TimelineControls } from '@/renderer/components/timeline-controls';
import { TimelineRuler } from '@/renderer/components/timeline-ruler';
import { TimelineTrack } from '@/renderer/components/timeline-track';
import type { Annotation } from '@/renderer/components/annotations-panel';

interface TimelineProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  annotations: Annotation[];
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

export function Timeline({
  isPlaying,
  currentTime,
  duration,
  annotations,
  onPlayPause,
  onSeek,
}: TimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate mock physiological data
  const generateSignalData = (frequency: number, amplitude: number) => {
    const samples = 1000;
    return Array.from({ length: samples }, (_, i) => {
      const t = (i / samples) * duration;
      return Math.sin(t * frequency) * amplitude + Math.random() * 0.1;
    });
  };

  const heartRateData = generateSignalData(2, 0.8);
  const respirationData = generateSignalData(0.5, 0.6);
  const skinConductanceData = generateSignalData(0.3, 0.4);

  const markers = [
    { time: 15, label: 'Start', color: '#22c55e' },
    { time: 45, label: 'Phase 2', color: '#eab308' },
    { time: 90, label: 'Phase 3', color: '#f59e0b' },
    { time: 120, label: 'End', color: '#a855f7' },
  ];

  // Combine system markers with user annotations
  const allMarkers = [
    ...markers,
    ...annotations.map(a => ({
      time: a.time,
      label: a.label,
      color: a.color,
    })),
  ];

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.5, 0.5));
  };

  const handleSkipBackward = () => {
    onSeek(Math.max(0, currentTime - 5));
  };

  const handleSkipForward = () => {
    onSeek(Math.min(duration, currentTime + 5));
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollOffset(container.scrollLeft);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to follow playhead
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isPlaying) return;

    const containerWidth = container.clientWidth;
    const totalWidth = containerWidth * zoom;
    const pixelsPerSecond = totalWidth / duration;
    const playheadPosition = currentTime * pixelsPerSecond;

    // Keep playhead in center third of viewport
    const targetScroll = playheadPosition - containerWidth / 2;
    if (targetScroll > scrollOffset + containerWidth * 0.66 || targetScroll < scrollOffset - containerWidth * 0.33) {
      container.scrollLeft = targetScroll;
    }
  }, [currentTime, isPlaying, zoom, duration, scrollOffset]);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <TimelineControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        zoom={zoom}
        onPlayPause={onPlayPause}
        onSkipBackward={handleSkipBackward}
        onSkipForward={handleSkipForward}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
      
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar"
      >
        <div style={{ width: `${zoom * 100}%`, minWidth: '100%' }}>
          <TimelineRuler
            duration={duration}
            currentTime={currentTime}
            zoom={zoom}
            scrollOffset={scrollOffset}
            onSeek={onSeek}
          />
          
          <TimelineTrack
            label="Heart Rate"
            type="signal"
            data={heartRateData}
            duration={duration}
            currentTime={currentTime}
            zoom={zoom}
            scrollOffset={scrollOffset}
            color="#ef4444"
          />
          
          <TimelineTrack
            label="Respiration"
            type="signal"
            data={respirationData}
            duration={duration}
            currentTime={currentTime}
            zoom={zoom}
            scrollOffset={scrollOffset}
            color="#3b82f6"
          />
          
          <TimelineTrack
            label="Skin Conductance"
            type="signal"
            data={skinConductanceData}
            duration={duration}
            currentTime={currentTime}
            zoom={zoom}
            scrollOffset={scrollOffset}
            color="#22c55e"
          />
          
          <TimelineTrack
            label="Markers"
            type="markers"
            markers={allMarkers}
            duration={duration}
            currentTime={currentTime}
            zoom={zoom}
            scrollOffset={scrollOffset}
          />
        </div>
      </div>
    </div>
  );
}
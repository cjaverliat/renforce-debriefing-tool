import {useRef, useState, useEffect, useMemo, ReactNode} from 'react';
import {TimelineControls} from '@/renderer/components/timeline-controls';
import {TimelineRuler} from '@/renderer/components/timeline-ruler';
import {TimelineTrack} from '@/renderer/components/timeline-track';
import type {PlaybackState} from '@/shared/types/playback';
import {usePlaybackTime} from '@/renderer/hooks/use-playback-time';
import {Group, Panel, Separator} from "react-resizable-panels";
import {TimelineLabel} from "@/renderer/components/timeline-label.tsx";
import {PhysiologicalSignalLabel} from "@/renderer/components/physiological-signal-label.tsx";
import {getTrackDisplayConfig, getMarkerColor} from '@/renderer/config/track-display';
import {Annotation} from "@/shared/types/session.ts";
import {PhysiologicalTrack, SystemMarker} from "@/shared/types/record.ts";

// Signal track content component
interface SignalContentProps {
    data: Array<{ time: number; value: number }>;
    duration: number;
    pixelsPerSecond: number;
    color: string;
}

interface DefaultTextLabelContentProps {
    children: ReactNode;
}

function DefaultTextLabelContent({children}: DefaultTextLabelContentProps) {
    return (
        <div className="w-full h-full flex flex-col content-center justify-center">
            <span className="text-xs text-zinc-400 px-4 py-2 truncate">{children}</span>
        </div>
    );
}

function SignalContent({data, duration, pixelsPerSecond, color}: SignalContentProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({width: 0, height: 0});

    // Calculate min/max for normalization
    const {minValue, maxValue} = useMemo(() => {
        if (data.length === 0) return {minValue: 0, maxValue: 1};
        let min = data[0].value;
        let max = data[0].value;
        for (const sample of data) {
            if (sample.value < min) min = sample.value;
            if (sample.value > max) max = sample.value;
        }
        // Add small padding to prevent clipping
        const padding = (max - min) * 0.1;
        return {minValue: min - padding, maxValue: max + padding};
    }, [data]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const {width, height} = entry.contentRect;
                setContainerSize({width, height});
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
        const endTime = rect.width / pixelsPerSecond;
        const valueRange = maxValue - minValue;

        // Filter to visible samples and draw at correct positions
        let isFirstPoint = true;
        for (const sample of data) {
            // Skip samples outside visible range (with small margin)
            if (sample.time < -1 || sample.time > endTime + 1) continue;

            const x = (sample.time) * pixelsPerSecond;
            // Normalize value to 0-1 range, then map to canvas height (inverted for canvas coords)
            const normalizedValue = (sample.value - minValue) / valueRange;
            const y = rect.height - (normalizedValue * rect.height);

            if (isFirstPoint) {
                ctx.moveTo(x, y);
                isFirstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }, [data, duration, pixelsPerSecond, color, containerSize, minValue, maxValue]);

    return (
        <div ref={containerRef} className="w-full h-full">
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
    pixelsPerSecond: number;
}

function MarkerContent({markers, duration, pixelsPerSecond}: MarkerContentProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({width: 0, height: 0});

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const {width, height} = entry.contentRect;
                setContainerSize({width, height});
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
        markers.forEach((marker) => {
            const x = marker.time * pixelsPerSecond;

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
    }, [markers, duration, pixelsPerSecond, containerSize]);

    return (
        <div ref={containerRef} className="w-full h-full">
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
    tracks: PhysiologicalTrack[];
    systemMarkers: SystemMarker[];
    onPlayPause: () => void;
    onSeek: (time: number) => void;
}

export function Timeline({
                             playbackState,
                             duration,
                             annotations,
                             tracks,
                             systemMarkers,
                             onPlayPause,
                             onSeek,
                         }: TimelineProps) {
    const {isPlaying} = playbackState;
    const [zoom, setZoom] = useState(1);
    const [scrollbarWidth, setScrollbarWidth] = useState(0);
    const [scrollbarHeight, setScrollbarHeight] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const labelsScrollRef = useRef<HTMLDivElement>(null);
    const rulerScrollRef = useRef<HTMLDivElement>(null);

    const playbackTime = usePlaybackTime(playbackState, {maxTime: duration});

    // Combine system markers with user annotations
    const allMarkers = useMemo(() => [
        ...systemMarkers.map(m => ({
            time: m.time,
            label: m.label,
            color: getMarkerColor(m.label),
        })),
        ...annotations.map(a => ({
            time: a.time,
            label: a.label,
            color: a.color,
        })),
    ], [systemMarkers, annotations]);

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

    // Sync scroll between ruler, tracks, and labels
    useEffect(() => {
        const tracksContainer = scrollContainerRef.current;
        const rulerContainer = rulerScrollRef.current;
        const labelsContainer = labelsScrollRef.current;
        if (!tracksContainer || !rulerContainer) return;

        const handleTracksScroll = () => {
            // Sync horizontal scroll with ruler
            rulerContainer.scrollLeft = tracksContainer.scrollLeft;
            // Sync vertical scroll with labels
            if (labelsContainer) {
                labelsContainer.scrollTop = tracksContainer.scrollTop;
            }
        };

        const handleRulerScroll = () => {
            tracksContainer.scrollLeft = rulerContainer.scrollLeft;
        };

        const handleLabelsScroll = () => {
            if (labelsContainer) {
                tracksContainer.scrollTop = labelsContainer.scrollTop;
            }
        };

        tracksContainer.addEventListener('scroll', handleTracksScroll);
        rulerContainer.addEventListener('scroll', handleRulerScroll);
        labelsContainer?.addEventListener('scroll', handleLabelsScroll);

        return () => {
            tracksContainer.removeEventListener('scroll', handleTracksScroll);
            rulerContainer.removeEventListener('scroll', handleRulerScroll);
            labelsContainer?.removeEventListener('scroll', handleLabelsScroll);
        };
    }, []);

    // Measure scrollbar dimensions when they become visible
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const updateScrollbarDimensions = () => {
            // Vertical scrollbar width (visible when content is taller than container)
            const hasVerticalScrollbar = container.scrollHeight > container.clientHeight;
            const verticalWidth = hasVerticalScrollbar ? container.offsetWidth - container.clientWidth : 0;
            setScrollbarWidth(verticalWidth);

            // Horizontal scrollbar height (visible when content is wider than container)
            const hasHorizontalScrollbar = container.scrollWidth > container.clientWidth;
            const horizontalHeight = hasHorizontalScrollbar ? container.offsetHeight - container.clientHeight : 0;
            setScrollbarHeight(horizontalHeight);
        };

        // Initial measurement
        updateScrollbarDimensions();

        // Update on resize
        const resizeObserver = new ResizeObserver(updateScrollbarDimensions);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, []);

    // // Auto-scroll to follow playhead
    // useEffect(() => {
    //     const container = scrollContainerRef.current;
    //     if (!container || !isPlaying) return;
    //
    //     const containerWidth = container.clientWidth;
    //     const totalWidth = containerWidth * zoom;
    //     const pixelsPerSecond = totalWidth / duration;
    //     const playheadPosition = playbackTime * pixelsPerSecond;
    //
    //     // Keep playhead in center third of viewport
    //     const targetScroll = playheadPosition - containerWidth / 2;
    //     if (targetScroll > scrollOffset + containerWidth * 0.66 || targetScroll < scrollOffset - containerWidth * 0.33) {
    //         container.scrollLeft = targetScroll;
    //     }
    // }, [playbackTime, isPlaying, zoom, duration, scrollOffset]);

    const pixelsPerSecond = 2 * zoom;
    const contentWidth = pixelsPerSecond * duration;

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

            {/* Main timeline area with labels on left and content on right */}
            <Group orientation="horizontal">

                {/* Labels */}
                <Panel minSize={50} maxSize={200} defaultSize={100}>
                    <div className="relative h-full w-full flex flex-col bg-zinc-900">
                        {/* Ruler label placeholder */}
                        <div className="absolute top-0 left-0 right-0 h-8 shrink-0 grow-0 border-b bg-zinc-900"/>

                        <div
                            ref={labelsScrollRef}
                            className="absolute top-8 left-0 right-0 bottom-0 overflow-x-hidden overflow-y-auto scrollbar-hidden"
                            style={{paddingBottom: scrollbarHeight > 0 ? `${scrollbarHeight}px` : undefined}}
                        >
                            <TimelineLabel>
                                <DefaultTextLabelContent>Markers</DefaultTextLabelContent>
                            </TimelineLabel>

                            {tracks.map((track, index) => {
                                const displayConfig = getTrackDisplayConfig(track.id, index);
                                return (
                                    <TimelineLabel key={track.id}>
                                        <PhysiologicalSignalLabel
                                            name={track.name}
                                            unit={track.unit}
                                            samplingRate={track.sampleRate}
                                            data={track.data}
                                            playbackState={playbackState}
                                            duration={duration}
                                            valueDecimals={displayConfig.valueDecimals}
                                        />
                                    </TimelineLabel>
                                );
                            })}
                        </div>
                    </div>
                </Panel>

                <Separator className="separator"/>

                <Panel minSize={100} id={"timeline-content-container"} className="relative">
                    {/* Sticky ruler at top */}
                    <div
                        ref={rulerScrollRef}
                        className="absolute top-0 left-0 right-0 h-8 overflow-x-auto overflow-y-hidden scrollbar-hidden z-10"
                        style={{paddingRight: scrollbarWidth > 0 ? `${scrollbarWidth}px` : undefined}}
                    >
                        <div style={{width: `${contentWidth}px`}}>
                            <TimelineRuler
                                duration={duration}
                                playbackState={playbackState}
                                pixelsPerSecond={pixelsPerSecond}
                                onSeek={onSeek}
                            />
                        </div>
                    </div>

                    {/* Scrollable tracks area */}
                    <div
                        ref={scrollContainerRef}
                        className="absolute top-8 left-0 right-0 bottom-0 overflow-x-auto overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex flex-col" style={{width: `${contentWidth}px`}}>

                            <TimelineTrack
                                duration={duration}
                                playbackState={playbackState}
                                pixelsPerSecond={pixelsPerSecond}
                            >
                                <MarkerContent
                                    markers={allMarkers}
                                    duration={duration}
                                    pixelsPerSecond={pixelsPerSecond}
                                />
                            </TimelineTrack>

                            {tracks.map((track, index) => {
                                const displayConfig = getTrackDisplayConfig(track.id, index);
                                return (
                                    <TimelineTrack
                                        key={track.id}
                                        duration={duration}
                                        playbackState={playbackState}
                                        pixelsPerSecond={pixelsPerSecond}
                                    >
                                        <SignalContent
                                            data={track.data}
                                            duration={duration}
                                            pixelsPerSecond={pixelsPerSecond}
                                            color={displayConfig.color}
                                        />
                                    </TimelineTrack>
                                );
                            })}
                        </div>
                    </div>
                </Panel>
            </Group>

        </div>
    );
}
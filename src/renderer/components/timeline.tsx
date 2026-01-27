import {useRef, useState, useEffect, useMemo, useCallback} from 'react';
import {TimelineControls} from '@/renderer/components/timeline-controls';
import {TimelineRuler} from '@/renderer/components/timeline-ruler';
import {TimelineTrack} from '@/renderer/components/timeline-track';
import {ResizeHandle} from '@/renderer/components/resize-handle';
import type {Annotation} from '@/renderer/components/annotations-panel';
import type {PlaybackState} from '@/shared/types/playback';
import {usePlaybackTime} from '@/renderer/hooks/use-playback-time';
import {Group, Panel, Separator} from "react-resizable-panels";

// Generate mock physiological data once at module load
function generateSignalData(duration: number, frequency: number, amplitude: number, samples = 1000) {
    return Array.from({length: samples}, (_, i) => {
        const time = (i / samples) * duration;
        const value = Math.sin((i / samples) * frequency * 100) * amplitude;
        return {time, value};
    });
}

const MOCK_DURATION = 60 * 10; // seconds
const MOCK_HEART_RATE_DATA = generateSignalData(MOCK_DURATION, 2, 0.8);
const MOCK_RESPIRATION_DATA = generateSignalData(MOCK_DURATION, 0.5, 0.6);
const MOCK_SKIN_CONDUCTANCE_DATA = generateSignalData(MOCK_DURATION, 0.3, 0.4);

const SYSTEM_MARKERS = [
    {time: 15, label: 'Start', color: '#22c55e'},
    {time: 45, label: 'Phase 2', color: '#eab308'},
    {time: 90, label: 'Phase 3', color: '#f59e0b'},
    {time: 120, label: 'End', color: '#a855f7'},
];

// Signal track content component
interface SignalContentProps {
    data: Array<{ time: number; value: number }>;
    duration: number;
    contentWidth: number;
    scrollOffset: number;
    color: string;
}

function SignalContent({data, duration, contentWidth, scrollOffset, color}: SignalContentProps) {
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

        // Draw signal waveform
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        // Calculate visible time range
        const pixelsPerSecond = contentWidth / duration;
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
    }, [data, duration, contentWidth, scrollOffset, color, containerSize]);

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
    contentWidth: number;
    scrollOffset: number;
}

function MarkerContent({markers, duration, contentWidth, scrollOffset}: MarkerContentProps) {
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
        const pixelsPerSecond = contentWidth / duration;
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
    }, [markers, duration, contentWidth, scrollOffset, containerSize]);

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
    const {isPlaying} = playbackState;
    const [zoom, setZoom] = useState(1);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [scrollbarWidth, setScrollbarWidth] = useState(0);
    const [labelsWidth, setLabelsWidth] = useState(128); // Default 128px (w-32)
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const labelsScrollRef = useRef<HTMLDivElement>(null);
    const rulerScrollRef = useRef<HTMLDivElement>(null);

    const playbackTime = usePlaybackTime(playbackState, {maxTime: duration});

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

    // Handle labels panel resize
    const handleLabelsResize = useCallback((delta: number) => {
        setLabelsWidth(prev => Math.max(80, Math.min(300, prev + delta)));
    }, []);

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

    // Sync horizontal scroll between ruler and tracks, and vertical scroll between labels and tracks
    useEffect(() => {
        const container = scrollContainerRef.current;
        const rulerContainer = rulerScrollRef.current;
        const labelsContainer = labelsScrollRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const scrollTop = container.scrollTop;
            setScrollOffset(scrollLeft);
            // Sync ruler scroll with tracks scroll
            if (rulerContainer) {
                rulerContainer.scrollLeft = scrollLeft;
            }
            // Sync labels vertical scroll with tracks scroll
            if (labelsContainer) {
                labelsContainer.scrollTop = scrollTop;
            }
        };

        const handleRulerScroll = () => {
            if (!rulerContainer) return;
            const scrollLeft = rulerContainer.scrollLeft;
            setScrollOffset(scrollLeft);
            // Sync tracks scroll with ruler scroll
            container.scrollLeft = scrollLeft;
        };

        const handleLabelsScroll = () => {
            if (!labelsContainer) return;
            // Sync tracks vertical scroll with labels scroll
            container.scrollTop = labelsContainer.scrollTop;
        };

        container.addEventListener('scroll', handleScroll);
        rulerContainer?.addEventListener('scroll', handleRulerScroll);
        labelsContainer?.addEventListener('scroll', handleLabelsScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            rulerContainer?.removeEventListener('scroll', handleRulerScroll);
            labelsContainer?.removeEventListener('scroll', handleLabelsScroll);
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
            <Group orientation="horizontal" className={"flex-1"}>
                <Panel minSize={50} maxSize={150} defaultSize={80}>
                    <div
                        className="flex flex-col bg-zinc-900"
                    >
                        {/* Ruler label placeholder */}
                        <div className="h-8 shrink-0 grow-0 border-b bg-zinc-900"/>

                        <div
                            ref={labelsScrollRef}
                            className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hidden"
                        >
                            <div className="h-16 px-3 py-2 flex items-center border-b border-zinc-800">
                                <span className="text-xs text-zinc-400 truncate">Markers</span>
                            </div>
                            <div className="h-16 px-3 py-2 flex items-center border-b border-zinc-800">
                                <span className="text-xs text-zinc-400 truncate">Heart Rate</span>
                            </div>
                            <div className="h-16 px-3 py-2 flex items-center border-b border-zinc-800">
                                <span className="text-xs text-zinc-400 truncate">Respiration</span>
                            </div>
                            <div className="h-16 px-3 py-2 flex items-center border-b border-zinc-800">
                                <span className="text-xs text-zinc-400 truncate">Skin Conductance</span>
                            </div>
                        </div>
                    </div>
                </Panel>

                <Separator className="separator"/>

                <Panel minSize={100} id={"timeline-content-container"} className="relative">
                    <div className="absolute inset-0 overflow-x-auto overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col" style={{width: `${contentWidth}px`}}>

                        <TimelineRuler
                            scrollRef={rulerScrollRef}
                            duration={duration}
                            playbackState={playbackState}
                            pixelsPerSecond={pixelsPerSecond}
                            onSeek={onSeek}
                        />

                        <TimelineTrack
                            contentSlot={
                                <MarkerContent
                                    markers={allMarkers}
                                    duration={duration}
                                    contentWidth={contentWidth}
                                    scrollOffset={scrollOffset}
                                />
                            }
                            duration={duration}
                            playbackState={playbackState}
                            zoom={zoom}
                            contentWidth={contentWidth}
                            scrollOffset={scrollOffset}
                        />

                        <TimelineTrack
                            contentSlot={
                                <SignalContent
                                    data={MOCK_HEART_RATE_DATA}
                                    duration={duration}
                                    contentWidth={contentWidth}
                                    scrollOffset={scrollOffset}
                                    color="#ef4444"
                                />
                            }
                            duration={duration}
                            playbackState={playbackState}
                            zoom={zoom}
                            contentWidth={contentWidth}
                            scrollOffset={scrollOffset}
                        />

                        <TimelineTrack
                            contentSlot={
                                <SignalContent
                                    data={MOCK_RESPIRATION_DATA}
                                    duration={duration}
                                    contentWidth={contentWidth}
                                    scrollOffset={scrollOffset}
                                    color="#3b82f6"
                                />
                            }
                            duration={duration}
                            playbackState={playbackState}
                            zoom={zoom}
                            contentWidth={contentWidth}
                            scrollOffset={scrollOffset}
                        />

                        <TimelineTrack
                            contentSlot={
                                <SignalContent
                                    data={MOCK_SKIN_CONDUCTANCE_DATA}
                                    duration={duration}
                                    contentWidth={contentWidth}
                                    scrollOffset={scrollOffset}
                                    color="#22c55e"
                                />
                            }
                            duration={duration}
                            playbackState={playbackState}
                            zoom={zoom}
                            contentWidth={contentWidth}
                            scrollOffset={scrollOffset}
                        />
                        </div>
                    </div>
                </Panel>
            </Group>

        </div>
    );
}
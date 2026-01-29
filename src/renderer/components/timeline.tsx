import {ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {TimelineControls} from '@/renderer/components/timeline-controls';
import {TimelineRuler} from '@/renderer/components/timeline-ruler';
import {TimelineTrack} from '@/renderer/components/timeline-track';
import type {PlaybackState} from '@/shared/types/playback';
import {usePlaybackTime} from '@/renderer/hooks/use-playback-time';
import {Group, Panel, Separator} from "react-resizable-panels";
import {TimelineLabel} from "@/renderer/components/timeline-label.tsx";
import {PhysiologicalSignalLabel} from "@/renderer/components/physiological-signal-label.tsx";
import {Annotation} from "@/shared/types/session.ts";
import {IncidentMarker, PhysiologicalSignal, Procedure, SystemMarker} from "@/shared/types/record.ts";
import {SignalContent} from "@/renderer/components/timeline-track-physio.tsx";
import {SystemContent} from "@/renderer/components/timeline-track-system.tsx";
import {ProceduresContent} from "@/renderer/components/timeline-track-procedures.tsx";
import {IncidentsContent} from "@/renderer/components/timeline-track-incidents.tsx";
import {AnnotationsContent} from "@/renderer/components/timeline-track-annotations.tsx";
import {VisibilityState} from "@/shared/types/visibility.ts";

interface DefaultTextLabelContentProps {
    children: ReactNode;
}

function DefaultTextLabelContent({children}: DefaultTextLabelContentProps) {
    return (
        <div className="w-full h-full flex flex-col justify-center px-4 py-1">
            <span className="text-xs font-medium text-zinc-300 truncate">
                {children}
            </span>
        </div>
    );
}


interface TimelineProps {
    playbackState: PlaybackState;
    duration: number;
    annotations: Annotation[];
    tracks: PhysiologicalSignal[];
    systemMarkers: SystemMarker[];
    incidentMarkers: IncidentMarker[];
    procedures: Procedure[];
    visibility: VisibilityState;
    onPlayPause: () => void;
    onSeek: (time: number) => void;
}

function getPhysioTrackColor(id: string) {
    let hash = 0;
    const saturation = 100;
    const lightness = 50;

    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2, 3, 5, 10];

export function Timeline({
                             playbackState,
                             duration,
                             annotations,
                             tracks,
                             systemMarkers,
                             incidentMarkers,
                             procedures,
                             visibility,
                             onPlayPause,
                             onSeek
                         }: TimelineProps) {

    const {isPlaying} = playbackState;
    const [zoomIndex, setZoomIndex] = useState(ZOOM_LEVELS.indexOf(1));
    const [scrollbarWidth, setScrollbarWidth] = useState(0);
    const [scrollbarHeight, setScrollbarHeight] = useState(0);

    const [visibleWidth, setVisibleWidth] = useState(0);

    const tracksContainerRef = useRef<HTMLDivElement>(null);
    const labelsScrollRef = useRef<HTMLDivElement>(null);
    const rulerScrollRef = useRef<HTMLDivElement>(null);

    const playbackTime = usePlaybackTime(playbackState, {maxTime: duration});

    const zoom = ZOOM_LEVELS[zoomIndex];

    const handleZoomIn = () => {
        setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
    };

    const handleZoomOut = () => {
        setZoomIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleZoomReset = () => {
        setZoomIndex(ZOOM_LEVELS.indexOf(1));
    };

    const handleSkipBackward = () => {
        onSeek(Math.max(0, playbackTime - 5));
    };

    const handleSkipForward = () => {
        onSeek(Math.min(duration, playbackTime + 5));
    };

    // Sync scroll between ruler, tracks, and labels
    useEffect(() => {
        const tracksContainer = tracksContainerRef.current;
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
        const container = tracksContainerRef.current;
        if (!container) return;

        const updateTracksContainerSize = () => {
            // Update scrollbar dimensions

            // Vertical scrollbar width (visible when content is taller than container)
            const hasVerticalScrollbar = container.scrollHeight > container.clientHeight;
            const verticalWidth = hasVerticalScrollbar ? container.offsetWidth - container.clientWidth : 0;
            setScrollbarWidth(verticalWidth);

            // Horizontal scrollbar height (visible when content is wider than container)
            const hasHorizontalScrollbar = container.scrollWidth > container.clientWidth;
            const horizontalHeight = hasHorizontalScrollbar ? container.offsetHeight - container.clientHeight : 0;
            setScrollbarHeight(horizontalHeight);

            // Update visible width
            const visibleWidth = container.clientWidth;
            setVisibleWidth(visibleWidth);
        };

        // Initial measurement
        updateTracksContainerSize();

        // Update on resize
        const resizeObserver = new ResizeObserver(updateTracksContainerSize);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, []);

    // // Auto-scroll to follow playhead
    // useEffect(() => {
    //     const container = tracksContainerRef.current;
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
    const contentWidth = Math.max(pixelsPerSecond * duration, visibleWidth);

    // Filtered data for Timeline
    const filteredTracks = useMemo(() => {
        return tracks.filter(
            track => visibility.visibleTrackIds.has(track.id)
        );
    }, [tracks, visibility.physioTracksVisible, visibility.visibleTrackIds]);

    const filteredSystemMarkers = useMemo(() => {
        return systemMarkers.filter(
            (marker, index) => visibility.visibleSystemMarkerIds.has(`${marker.time}:${marker.label}:${index}`)
        );
    }, [systemMarkers, visibility.systemMarkersVisible, visibility.visibleSystemMarkerIds]);

    const filteredProcedures = useMemo(() => {
        return procedures
            .filter(proc => visibility.visibleProcedureIds.has(proc.id))
            .map(proc => ({
                ...proc,
                actionMarkers: proc.actionMarkers.filter(
                    (_, index) => visibility.visibleActionMarkerIds.has(`${proc.id}:${index}`)
                )
            }));
    }, [procedures, visibility.proceduresVisible, visibility.visibleProcedureIds, visibility.visibleActionMarkerIds]);

    const filteredIncidentMarkers = useMemo(() => {
        return incidentMarkers.filter(
            (marker, index) => visibility.visibleIncidentMarkerIds.has(`${marker.time}:${marker.label}:${index}`)
        );
    }, [incidentMarkers, visibility.incidentMarkersVisible, visibility.visibleIncidentMarkerIds]);

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
                onZoomReset={handleZoomReset}
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
                            {visibility.proceduresVisible && (
                                <TimelineLabel>
                                    <DefaultTextLabelContent>Procedures</DefaultTextLabelContent>
                                </TimelineLabel>
                            )}

                            {visibility.incidentMarkersVisible && (
                                <TimelineLabel>
                                    <DefaultTextLabelContent>Incidents</DefaultTextLabelContent>
                                </TimelineLabel>
                            )}

                            {visibility.systemMarkersVisible && (
                                <TimelineLabel>
                                    <DefaultTextLabelContent>System Markers</DefaultTextLabelContent>
                                </TimelineLabel>
                            )}

                            <TimelineLabel>
                                <DefaultTextLabelContent>Annotations</DefaultTextLabelContent>
                            </TimelineLabel>

                            {visibility.physioTracksVisible && (filteredTracks.map((track, index) => {
                                return (
                                    <TimelineLabel key={index}>
                                        <PhysiologicalSignalLabel
                                            name={track.name}
                                            unit={track.unit}
                                            samplingRate={track.sampleRate}
                                            data={track.data}
                                            playbackState={playbackState}
                                            duration={duration}
                                        />
                                    </TimelineLabel>
                                );
                            }))
                            }
                        </div>
                    </div>
                </Panel>

                <Separator className="separator"/>

                <Panel minSize={100} className="relative">
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
                        ref={tracksContainerRef}
                        className="absolute top-8 left-0 right-0 bottom-0 overflow-x-auto overflow-y-auto custom-scrollbar"
                    >
                        <div className="flex flex-col" style={{width: `${contentWidth}px`}}>

                            {visibility.proceduresVisible && (
                                <TimelineTrack
                                    duration={duration}
                                    playbackState={playbackState}
                                    pixelsPerSecond={pixelsPerSecond}
                                >
                                    <ProceduresContent
                                        procedures={filteredProcedures}
                                        duration={duration}
                                        pixelsPerSecond={pixelsPerSecond}
                                        onSeek={onSeek}
                                    />
                                </TimelineTrack>
                            )}

                            {visibility.incidentMarkersVisible && (
                                <TimelineTrack
                                    duration={duration}
                                    playbackState={playbackState}
                                    pixelsPerSecond={pixelsPerSecond}
                                >
                                    <IncidentsContent
                                        incidentMarkers={filteredIncidentMarkers}
                                        pixelsPerSecond={pixelsPerSecond}
                                        onSeek={onSeek}
                                    />
                                </TimelineTrack>
                            )}

                            {visibility.systemMarkersVisible && (
                                <TimelineTrack
                                    duration={duration}
                                    playbackState={playbackState}
                                    pixelsPerSecond={pixelsPerSecond}
                                >
                                    <SystemContent
                                        markers={filteredSystemMarkers}
                                        duration={duration}
                                        pixelsPerSecond={pixelsPerSecond}
                                        onSeek={onSeek}
                                    />
                                </TimelineTrack>
                            )}

                            <TimelineTrack
                                duration={duration}
                                playbackState={playbackState}
                                pixelsPerSecond={pixelsPerSecond}
                            >
                                <AnnotationsContent
                                    annotations={annotations}
                                    duration={duration}
                                    pixelsPerSecond={pixelsPerSecond}
                                    onSeek={onSeek}
                                />
                            </TimelineTrack>

                            {visibility.physioTracksVisible && (filteredTracks.map((track, index) => {
                                return (
                                    <TimelineTrack
                                        key={index}
                                        duration={duration}
                                        playbackState={playbackState}
                                        pixelsPerSecond={pixelsPerSecond}
                                    >
                                        <SignalContent
                                            data={track.data}
                                            duration={duration}
                                            pixelsPerSecond={pixelsPerSecond}
                                            color={getPhysioTrackColor(track.id)}
                                        />
                                    </TimelineTrack>
                                );
                            }))}
                        </div>
                    </div>
                </Panel>
            </Group>

        </div>
    );
}
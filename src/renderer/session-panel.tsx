import {useEffect, useMemo, useState} from 'react';
import {Annotation, SessionData} from "@/shared/types/session.ts";
import {VisibilityState} from "@/shared/types/visibility.ts";
import {ExportControls} from "@/renderer/components/export-controls.tsx";
import {Button} from "@/renderer/components/ui/button.tsx";
import {Plus} from "lucide-react";
import {Group, Panel, Separator} from "react-resizable-panels";
import {VideoPlayer} from "@/renderer/components/video-player.tsx";
import {AnnotationsPanel} from "@/renderer/components/annotations-panel.tsx";
import {Timeline} from "@/renderer/components/timeline.tsx";
import {AnnotationDialog} from "@/renderer/components/annotation-dialog.tsx";
import {SessionInfoPanel} from "@/renderer/components/session-info-panel.tsx";
import {computeCurrentTime, createInitialPlaybackState, PlaybackState} from "@/shared/types/playback.ts";
import {usePlaybackTime} from "@/renderer/hooks/use-playback-time.ts";

function createInitialVisibilityState(sessionData: SessionData): VisibilityState {
    const {tracks, systemMarkers, procedures} = sessionData.recordData;

    return {
        physioTracksVisible: true,
        systemMarkersVisible: true,
        proceduresVisible: true,
        visibleTrackIds: new Set(tracks.map(t => t.id)),
        visibleSystemMarkerIds: new Set(
            systemMarkers.map((m, i) => `${m.time}:${m.label}:${i}`)
        ),
        visibleProcedureIds: new Set(procedures.map(p => p.id)),
        visibleActionMarkerIds: new Set(
            procedures.flatMap(p =>
                p.actionMarkers.map((_, i) => `${p.id}:${i}`)
            )
        ),
    };
}

/**
 * Converts a video path to a source URL.
 * - HTTP/HTTPS URLs are returned as-is
 * - Local file paths are prefixed with media:// protocol
 */
function toVideoSrc(videoPath: string): string {
    if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        return videoPath;
    }
    return `media://${videoPath}`;
}

interface SessionPanelProps {
    sessionData: SessionData;
}

export function SessionPanel({sessionData}: SessionPanelProps) {

    const [isDirty, setIsDirty] = useState(false);

    // Playback state
    const [playbackState, setPlaybackState] = useState<PlaybackState>(createInitialPlaybackState);
    const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false);

    const playbackTime = usePlaybackTime(playbackState, {maxTime: sessionData.recordData.duration});

    // Visibility state
    const [visibility, setVisibility] = useState<VisibilityState>(() =>
        createInitialVisibilityState(sessionData)
    );

    // Category-level toggle handlers
    const handleTogglePhysioTracks = (checked: boolean) => {
        setVisibility(prev => ({...prev, physioTracksVisible: checked}));
    };

    const handleToggleSystemMarkers = (checked: boolean) => {
        setVisibility(prev => ({...prev, systemMarkersVisible: checked}));
    };

    const handleToggleProcedures = (checked: boolean) => {
        setVisibility(prev => ({...prev, proceduresVisible: checked}));
    };

    // Individual item toggle handlers
    const handleToggleTrack = (trackId: string, checked: boolean) => {
        setVisibility(prev => {
            const newSet = new Set(prev.visibleTrackIds);
            if (checked) {
                newSet.add(trackId);
            } else {
                newSet.delete(trackId);
            }
            return {...prev, visibleTrackIds: newSet};
        });
    };

    const handleToggleSystemMarker = (markerId: string, checked: boolean) => {
        setVisibility(prev => {
            const newSet = new Set(prev.visibleSystemMarkerIds);
            if (checked) {
                newSet.add(markerId);
            } else {
                newSet.delete(markerId);
            }
            return {...prev, visibleSystemMarkerIds: newSet};
        });
    };

    const handleToggleProcedure = (procedureId: string, checked: boolean) => {
        setVisibility(prev => {
            const newSet = new Set(prev.visibleProcedureIds);
            if (checked) {
                newSet.add(procedureId);
            } else {
                newSet.delete(procedureId);
            }
            return {...prev, visibleProcedureIds: newSet};
        });
    };

    const handleToggleActionMarker = (actionMarkerId: string, checked: boolean) => {
        setVisibility(prev => {
            const newSet = new Set(prev.visibleActionMarkerIds);
            if (checked) {
                newSet.add(actionMarkerId);
            } else {
                newSet.delete(actionMarkerId);
            }
            return {...prev, visibleActionMarkerIds: newSet};
        });
    };

    // Filtered data for Timeline
    const filteredTracks = useMemo(() => {
        if (!visibility.physioTracksVisible) return [];
        return sessionData.recordData.tracks.filter(
            track => visibility.visibleTrackIds.has(track.id)
        );
    }, [sessionData.recordData.tracks, visibility.physioTracksVisible, visibility.visibleTrackIds]);

    const filteredSystemMarkers = useMemo(() => {
        if (!visibility.systemMarkersVisible) return null;
        return sessionData.recordData.systemMarkers.filter(
            (marker, index) => visibility.visibleSystemMarkerIds.has(`${marker.time}:${marker.label}:${index}`)
        );
    }, [sessionData.recordData.systemMarkers, visibility.systemMarkersVisible, visibility.visibleSystemMarkerIds]);

    const filteredProcedures = useMemo(() => {
        if (!visibility.proceduresVisible) return [];
        return sessionData.recordData.procedures
            .filter(proc => visibility.visibleProcedureIds.has(proc.id))
            .map(proc => ({
                ...proc,
                actionMarkers: proc.actionMarkers.filter(
                    (_, index) => visibility.visibleActionMarkerIds.has(`${proc.id}:${index}`)
                )
            }));
    }, [sessionData.recordData.procedures, visibility.proceduresVisible, visibility.visibleProcedureIds, visibility.visibleActionMarkerIds]);

    const handlePlayPause = () => {
        setPlaybackState(prev => {
            const now = performance.now();
            const currentTime = computeCurrentTime(prev, now);
            return {
                ...prev,
                anchorTime: currentTime,
                anchorTimestamp: now,
                isPlaying: !prev.isPlaying,
            };
        });
    };

    const handleSeek = (time: number) => {
        setPlaybackState(prev => ({
            ...prev,
            anchorTime: time,
            anchorTimestamp: performance.now(),
        }));
    };

    const handleAddAnnotation = () => {
        // Pause video when adding annotation
        setPlaybackState(prev => {
            const now = performance.now();
            const currentTime = computeCurrentTime(prev, now);
            return {
                ...prev,
                anchorTime: currentTime,
                anchorTimestamp: now,
                isPlaying: false,
            };
        });
        setIsAnnotationDialogOpen(true);
    };

    const handleSaveAnnotation = (annotationData: {
        time: number;
        label: string;
        description: string;
        color: string;
        category: string;
    }) => {
        const newAnnotation: Annotation = {
            id: `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            ...annotationData,
            timestamp: new Date(),
        };
        sessionData.manualAnnotations.push(newAnnotation);
        setIsDirty(true);
    };

    const handleDeleteAnnotation = (id: string) => {
        sessionData.manualAnnotations = sessionData.manualAnnotations.filter(
            (annotation) => annotation.id !== id,
        )
        setIsDirty(true);
    };

    const handleSeekToAnnotation = (time: number) => {
        setPlaybackState(prev => ({
            ...prev,
            anchorTime: time,
            anchorTimestamp: performance.now(),
        }));
    };

    // // Auto-save handler
    // const handleSave = useCallback(async () => {
    //     if (!sessionData) return;
    //     await window.electronAPI.savePlmd(sessionData.plmdPath, plmdData);
    //     setIsDirty(false);
    // }, [sessionData, duration]);
    //
    // // Use auto-save hook with 1 second debounce
    // useAutoSave({
    //     delay: 1000,
    //     onSave: handleSave,
    //     isDirty,
    // });

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Space bar for play/pause
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                handlePlayPause();
            }
            // 'M' key to add annotation
            if (e.code === 'KeyM' && !isAnnotationDialogOpen) {
                e.preventDefault();
                handleAddAnnotation();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [isAnnotationDialogOpen]);

    return (
        <div className="size-full flex flex-col bg-zinc-950">
            {/* Header with controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <h1 className="text-lg text-zinc-100">
                    Debriefing Session
                </h1>
                <div className="flex items-center gap-2">
                    <ExportControls sessionData={sessionData}/>
                    <div className="w-px h-6 bg-zinc-700"/>
                    <Button
                        onClick={handleAddAnnotation}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                    >
                        <Plus className="size-4 mr-2"/>
                        Add Annotation (M)
                    </Button>
                </div>
            </div>

            <Group orientation="vertical">

                {/* Top part panel containing the info about the session, the video player and annotations  */}
                <Panel minSize={200}>
                    <Group orientation="horizontal">

                        {/* Left side panel */}
                        <Panel minSize={200} defaultSize={210} className="w-full">
                            <SessionInfoPanel
                                tracks={sessionData.recordData.tracks}
                                systemMarkers={sessionData.recordData.systemMarkers}
                                procedures={sessionData.recordData.procedures}
                                visibility={visibility}
                                onTogglePhysioTracks={handleTogglePhysioTracks}
                                onToggleSystemMarkers={handleToggleSystemMarkers}
                                onToggleProcedures={handleToggleProcedures}
                                onToggleTrack={handleToggleTrack}
                                onToggleSystemMarker={handleToggleSystemMarker}
                                onToggleProcedure={handleToggleProcedure}
                                onToggleActionMarker={handleToggleActionMarker}
                            />
                        </Panel>

                        <Separator className={"separator"}/>

                        {/* Player panel */}
                        <Panel minSize={300}>
                            <div className="h-full p-4 overflow-hidden">
                                <VideoPlayer
                                    videoSrc={toVideoSrc(sessionData.recordData.videoPath)}
                                    playbackState={playbackState}
                                    duration={sessionData.recordData.duration}
                                />
                            </div>
                        </Panel>

                        <Separator className={"separator"}/>

                        {/* Right side panel */}
                        <Panel minSize={200} defaultSize={210}>
                            <AnnotationsPanel
                                annotations={sessionData.manualAnnotations}
                                onDeleteAnnotation={handleDeleteAnnotation}
                                onSeekToAnnotation={handleSeekToAnnotation}
                            />
                        </Panel>
                    </Group>
                </Panel>

                <Separator className={"separator"}/>

                {/* Timeline panel (bottom part) */}
                <Panel minSize={300}>
                    <Timeline
                        playbackState={playbackState}
                        duration={sessionData.recordData.duration}
                        annotations={sessionData.manualAnnotations}
                        tracks={filteredTracks}
                        systemMarkers={filteredSystemMarkers}
                        procedures={filteredProcedures}
                        proceduresVisible={visibility.proceduresVisible}
                        onPlayPause={handlePlayPause}
                        onSeek={handleSeek}
                    />
                </Panel>
            </Group>

            {/* Annotation Dialog */}
            <AnnotationDialog
                isOpen={isAnnotationDialogOpen}
                currentTime={playbackTime}
                onClose={() => setIsAnnotationDialogOpen(false)}
                onSave={handleSaveAnnotation}
            />
        </div>
    );
}

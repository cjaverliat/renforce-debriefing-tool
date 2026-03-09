import {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Annotation, SelectedItem, Session} from "@/shared/types/session.ts";
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
import {LanguageSwitcher} from "@/renderer/components/language-switcher.tsx";
import {ThemeSwitcher} from "@/renderer/components/theme-switcher.tsx";
import {computeCurrentTime, createInitialPlaybackState, PlaybackState} from "@/shared/types/playback.ts";
import {usePlaybackTime} from "@/renderer/hooks/use-playback-time.ts";

function createInitialVisibilityState(session: Session): VisibilityState {
    const {tracks, systemMarkers, incidentMarkers, procedures} = session.recordData;

    return {
        physioTracksVisible: true,
        systemMarkersVisible: true,
        incidentMarkersVisible: true,
        proceduresVisible: true,
        visibleTrackIds: new Set(tracks.map(t => t.id)),
        visibleSystemMarkerIds: new Set(
            systemMarkers.map((m, i) => `${m.time}:${m.label}:${i}`)
        ),
        visibleIncidentMarkerIds: new Set(
            incidentMarkers.map((m, i) => `${m.time}:${m.label}:${i}`)
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
    const normalized = videoPath.replace(/\\/g, '/');
    return `media://${normalized.startsWith('/') ? normalized : '/' + normalized}`;
}

interface SessionPanelProps {
    session: Session;
}

export function SessionPanel({session}: SessionPanelProps) {
    const {t} = useTranslation();

    const [isDirty, setIsDirty] = useState(false);
    const [annotations, setAnnotations] = useState<Annotation[]>(session.sessionData.manualAnnotations);

    // Playback state
    const [playbackState, setPlaybackState] = useState<PlaybackState>(createInitialPlaybackState);
    const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false);
    const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);

    const playbackTime = usePlaybackTime(playbackState, {maxTime: session.recordData.duration});

    // Visibility state
    const [visibility, setVisibility] = useState<VisibilityState>(() =>
        createInitialVisibilityState(session)
    );

    // Selection state for timeline → panel navigation
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
    const [selectionVersion, setSelectionVersion] = useState(0);
    const [activeLeftPanelTab, setActiveLeftPanelTab] = useState<string>('physio');

    const handleSelectItem = (item: SelectedItem) => {
        setSelectedItem(item);
        setSelectionVersion(prev => prev + 1);
        switch (item.type) {
            case 'systemMarker':   setActiveLeftPanelTab('markers'); break;
            case 'incidentMarker': setActiveLeftPanelTab('incidents'); break;
            case 'procedure':
            case 'actionMarker':   setActiveLeftPanelTab('procedures'); break;
            // 'annotation' → right panel, no left tab change
        }
    };

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

    const handleToggleIncidentMarkers = (checked: boolean) => {
        setVisibility(prev => ({...prev, incidentMarkersVisible: checked}));
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

    const handleToggleIncidentMarker = (markerId: string, checked: boolean) => {
        setVisibility(prev => {
            const newSet = new Set(prev.visibleIncidentMarkerIds);
            if (checked) {
                newSet.add(markerId);
            } else {
                newSet.delete(markerId);
            }
            return {...prev, visibleIncidentMarkerIds: newSet};
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

    const handleEditAnnotation = (id: string) => {
        const annotation = annotations.find(a => a.id === id);
        if (!annotation) return;
        setEditingAnnotation(annotation);
        setIsAnnotationDialogOpen(true);
    };

    const handleSaveAnnotation = (annotationData: {
        time: number;
        label: string;
        description: string;
        color: string;
    }) => {
        if (editingAnnotation) {
            setAnnotations(prev => prev.map(a =>
                a.id === editingAnnotation.id ? { ...a, ...annotationData } : a
            ));
            setEditingAnnotation(null);
        } else {
            const newAnnotation: Annotation = {
                id: `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                ...annotationData,
            };
            setAnnotations(prev => [...prev, newAnnotation]);
        }
        setIsDirty(true);
    };

    const handleDeleteAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(annotation => annotation.id !== id));
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
        <div className="size-full flex flex-col bg-background">
            {/* Header with controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
                <h1 className="text-lg text-foreground">
                    {t('session.title')}
                </h1>
                <div className="flex items-center gap-2">
                    <ThemeSwitcher/>
                    <LanguageSwitcher/>
                    <div className="w-px h-6 bg-border"/>
                    <ExportControls session={session} annotations={annotations}/>
                    <div className="w-px h-6 bg-border"/>
                    <Button
                        onClick={handleAddAnnotation}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                    >
                        <Plus className="size-4 mr-2"/>
                        {t('session.addAnnotation')}
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
                                tracks={session.recordData.tracks}
                                systemMarkers={session.recordData.systemMarkers}
                                incidentMarkers={session.recordData.incidentMarkers}
                                procedures={session.recordData.procedures}
                                visibility={visibility}
                                onTogglePhysioTracks={handleTogglePhysioTracks}
                                onToggleSystemMarkers={handleToggleSystemMarkers}
                                onToggleIncidentMarkers={handleToggleIncidentMarkers}
                                onToggleProcedures={handleToggleProcedures}
                                onToggleTrack={handleToggleTrack}
                                onToggleSystemMarker={handleToggleSystemMarker}
                                onToggleIncidentMarker={handleToggleIncidentMarker}
                                onToggleProcedure={handleToggleProcedure}
                                onToggleActionMarker={handleToggleActionMarker}
                                onSeek={handleSeek}
                                selectedItem={selectedItem ?? undefined}
                                selectionVersion={selectionVersion}
                                activeTab={activeLeftPanelTab}
                                onTabChange={setActiveLeftPanelTab}
                            />
                        </Panel>

                        <Separator className={"separator"}/>

                        {/* Player panel */}
                        <Panel minSize={300}>
                            <div className="h-full p-4 overflow-hidden">
                                {/*TODO: split video duration and record duration*/}
                                <VideoPlayer
                                    videoSrc={session.sessionData.videoPath ? toVideoSrc(session.sessionData.videoPath) : undefined}
                                    playbackState={playbackState}
                                    duration={session.recordData.duration}
                                />
                            </div>
                        </Panel>

                        <Separator className={"separator"}/>

                        {/* Right side panel */}
                        <Panel minSize={200} defaultSize={210}>
                            <AnnotationsPanel
                                annotations={annotations}
                                onDeleteAnnotation={handleDeleteAnnotation}
                                onEditAnnotation={handleEditAnnotation}
                                onSeekToAnnotation={handleSeekToAnnotation}
                                selectedAnnotationId={selectedItem?.type === 'annotation' ? selectedItem.id : undefined}
                                selectionVersion={selectionVersion}
                            />
                        </Panel>
                    </Group>
                </Panel>

                <Separator className={"separator"}/>

                {/* Timeline panel (bottom part) */}
                <Panel minSize={300}>
                    <Timeline
                        playbackState={playbackState}
                        duration={session.recordData.duration}
                        annotations={annotations}
                        tracks={session.recordData.tracks}
                        systemMarkers={session.recordData.systemMarkers}
                        incidentMarkers={session.recordData.incidentMarkers}
                        procedures={session.recordData.procedures}
                        visibility={visibility}
                        onPlayPause={handlePlayPause}
                        onSeek={handleSeek}
                        selectedItem={selectedItem ?? undefined}
                        onSelectItem={handleSelectItem}
                    />
                </Panel>
            </Group>

            {/* Annotation Dialog */}
            <AnnotationDialog
                isOpen={isAnnotationDialogOpen}
                currentTime={playbackTime}
                annotationToEdit={editingAnnotation ?? undefined}
                onClose={() => {
                    setIsAnnotationDialogOpen(false);
                    setEditingAnnotation(null);
                }}
                onSave={handleSaveAnnotation}
            />
        </div>
    );
}

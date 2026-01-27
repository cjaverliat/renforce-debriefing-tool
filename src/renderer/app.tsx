import {useState, useEffect, useCallback} from 'react';
import {Plus} from 'lucide-react';
import {Timeline} from '@/renderer/components/timeline';
import {AnnotationDialog} from '@/renderer/components/annotation-dialog';
import {AnnotationsPanel, type Annotation} from '@/renderer/components/annotations-panel';
import {ExportControls} from '@/renderer/components/export-controls';
import {Button} from '@/renderer/components/ui/button';
import {LoadingPanel} from '@/renderer/components/loading-panel';
import {useAutoSave} from '@/renderer/hooks/use-auto-save';
import {usePlaybackTime} from '@/renderer/hooks/use-playback-time';
import type {LoadedSession, PLMDData} from '@/shared/types/session';
import {type PlaybackState, createInitialPlaybackState, computeCurrentTime} from '@/shared/types/playback';
import {VideoPlayer} from "@/renderer/components/video-player.tsx";
import {Group, Panel, Separator} from "react-resizable-panels";

type AppMode = 'loading' | 'session';

export function App() {
    // App mode and session state
    const [appMode, setAppMode] = useState<AppMode>('loading');
    const [sessionState, setSessionState] = useState<LoadedSession | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Playback state
    const [playbackState, setPlaybackState] = useState<PlaybackState>(createInitialPlaybackState);
    const [duration, setDuration] = useState(596.48);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false);

    const playbackTime = usePlaybackTime(playbackState, {maxTime: duration});

    // Session data for export
    const sessionData = {
        duration,
        videoName: sessionState?.plmdData.sessionData.videoName || 'Training Session',
        sessionDate: sessionState?.plmdData.sessionData.sessionDate
            ? new Date(sessionState.plmdData.sessionData.sessionDate)
            : new Date(),
    };

    const videoSrc = sessionState
        ? `media://${sessionState.videoPath}`
        : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    const handleSessionLoaded = (session: LoadedSession) => {
        setSessionState(session);
        setAnnotations(session.plmdData.annotations);
        setDuration(session.plmdData.sessionData.duration);
        setAppMode('session');
        setIsDirty(false);
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

    const handleSaveAnnotation = (annotationData: {
        time: number;
        label: string;
        description: string;
        color: string;
        category: string;
    }) => {
        const newAnnotation: Annotation = {
            id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...annotationData,
            timestamp: new Date(),
        };
        setAnnotations([...annotations, newAnnotation]);
        setIsDirty(true);
    };

    const handleDeleteAnnotation = (id: string) => {
        setAnnotations(annotations.filter(a => a.id !== id));
        setIsDirty(true);
    };

    const handleSeekToAnnotation = (time: number) => {
        setPlaybackState(prev => ({
            ...prev,
            anchorTime: time,
            anchorTimestamp: performance.now(),
        }));
    };

    // Auto-save handler
    const handleSave = useCallback(async () => {
        if (!sessionState) return;

        // Build PLMD data with current state
        const plmdData: PLMDData = {
            version: '1.0',
            metadata: {
                ...sessionState.plmdData.metadata,
                lastModified: new Date().toISOString(),
            },
            files: {
                plm: await window.electronAPI.makeRelativePath(
                    sessionState.plmdPath,
                    sessionState.plmPath
                ),
                video: await window.electronAPI.makeRelativePath(
                    sessionState.plmdPath,
                    sessionState.videoPath
                ),
            },
            annotations,
            sessionData: {
                duration,
                videoName: sessionState.plmdData.sessionData.videoName,
                sessionDate: sessionState.plmdData.sessionData.sessionDate,
            },
        };

        await window.electronAPI.savePlmd(sessionState.plmdPath, plmdData);
        setIsDirty(false);
    }, [sessionState, annotations, duration]);

    // Use auto-save hook with 1 second debounce
    useAutoSave({
        delay: 1000,
        onSave: handleSave,
        isDirty,
    });

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Only active in session mode
            if (appMode !== 'session') return;

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
    }, [appMode, isAnnotationDialogOpen]);

    // Show loading panel if in loading mode
    if (appMode === 'loading') {
        return <LoadingPanel onSessionLoaded={handleSessionLoaded}/>;
    }

    // Show main debriefing UI
    return (
        <div className="size-full flex flex-col bg-zinc-950">
            {/* Header with controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <h1 className="text-lg text-zinc-100">
                    {sessionState?.plmdData.metadata.sessionName || 'Debriefing Session'}
                </h1>
                <div className="flex items-center gap-2">
                    <ExportControls annotations={annotations} sessionData={sessionData}/>
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
                <Panel minSize={200}>
                    <Group orientation="horizontal">

                        {/* Left side panel */}
                        <Panel minSize={200} defaultSize={210}>

                        </Panel>

                        <Separator className={"separator"}/>

                        {/* Player panel */}
                        <Panel minSize={300}>
                            <div className="h-full p-4 overflow-hidden">
                                <VideoPlayer
                                    videoSrc={videoSrc}
                                    playbackState={playbackState}
                                    duration={duration}
                                />
                            </div>
                        </Panel>

                        <Separator className={"separator"}/>

                        {/* Right side panel */}
                        <Panel minSize={200} defaultSize={210}>
                            <AnnotationsPanel
                                annotations={annotations}
                                onDeleteAnnotation={handleDeleteAnnotation}
                                onSeekToAnnotation={handleSeekToAnnotation}
                            />
                        </Panel>
                    </Group>
                </Panel>

                <Separator className={"separator"}/>

                <Panel minSize={300}>
                    <Timeline
                        playbackState={playbackState}
                        duration={duration}
                        annotations={annotations}
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

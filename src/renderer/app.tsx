import {useState, useEffect, useCallback} from 'react';
import {Plus} from 'lucide-react';
import {Timeline} from '@/renderer/components/timeline';
import {AnnotationDialog} from '@/renderer/components/annotation-dialog';
import {AnnotationsPanel, type Annotation} from '@/renderer/components/annotations-panel';
import {ExportControls} from '@/renderer/components/export-controls';
import {Button} from '@/renderer/components/ui/button';
import {ResizeHandle} from '@/renderer/components/resize-handle';
import {LoadingPanel} from '@/renderer/components/loading-panel';
import {useAutoSave} from '@/renderer/hooks/use-auto-save';
import {usePlaybackTime} from '@/renderer/hooks/use-playback-time';
import type {LoadedSession, PLMDData} from '@/shared/types/session';
import {type PlaybackState, createInitialPlaybackState, computeCurrentTime} from '@/shared/types/playback';
import {VideoPlayer} from "@/renderer/components/video-player.tsx";

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

    // Panel sizes (in pixels)
    const [timelineHeight, setTimelineHeight] = useState(300);
    const [sidebarWidth, setSidebarWidth] = useState(320);

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

    // Handle vertical resize (timeline height)
    const handleVerticalResize = (delta: number) => {
        const minTimelineHeight = 150;
        const maxTimelineHeight = 400;

        setTimelineHeight((prev) => {
            const newHeight = prev - delta;
            return Math.max(minTimelineHeight, Math.min(maxTimelineHeight, newHeight));
        });
    };

    // Handle horizontal resize (sidebar width)
    const handleHorizontalResize = (delta: number) => {
        const minSidebarWidth = 200;
        const maxSidebarWidth = 600;

        setSidebarWidth((prev) => {
            const newWidth = prev - delta;
            return Math.max(minSidebarWidth, Math.min(maxSidebarWidth, newWidth));
        });
    };

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

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col">
                    {/* Video Panel - takes remaining space */}
                    <div className="flex-1 flex-col content-center p-4 overflow-hidden">
                        <VideoPlayer
                            videoSrc={videoSrc}
                            playbackState={playbackState}
                            duration={duration}
                        />
                    </div>

                    {/* Resize Handle between Video and Timeline */}
                    <ResizeHandle direction="vertical" onResize={handleVerticalResize}/>

                    {/* Timeline Panel - fixed height at bottom */}
                    <div className="shrink-0" style={{height: `${timelineHeight}px`}}>
                        <Timeline
                            playbackState={playbackState}
                            duration={duration}
                            annotations={annotations}
                            onPlayPause={handlePlayPause}
                            onSeek={handleSeek}
                        />
                    </div>
                </div>

                {/* Resize Handle between Main and Sidebar */}
                <ResizeHandle direction="horizontal" onResize={handleHorizontalResize}/>

                {/* Annotations Sidebar - fixed width on right */}
                <div className="shrink-0" style={{width: `${sidebarWidth}px`}}>
                    <AnnotationsPanel
                        annotations={annotations}
                        onDeleteAnnotation={handleDeleteAnnotation}
                        onSeekToAnnotation={handleSeekToAnnotation}
                    />
                </div>
            </div>

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

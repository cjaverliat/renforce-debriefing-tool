import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { VideoPlayer } from '@/renderer/components/video-player';
import { Timeline } from '@/renderer/components/timeline';
import { AnnotationDialog } from '@/renderer/components/annotation-dialog';
import { AnnotationsPanel, type Annotation } from '@/renderer/components/annotations-panel';
import { ExportControls } from '@/renderer/components/export-controls';
import { Button } from '@/renderer/components/ui/button';
import { ResizeHandle } from '@/renderer/components/resize-handle';

export function App() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(596.48); // Default duration for sample video
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [isAnnotationDialogOpen, setIsAnnotationDialogOpen] = useState(false);

    // Panel sizes (in pixels)
    const [timelineHeight, setTimelineHeight] = useState(300); // Timeline height instead of video height
    const [sidebarWidth, setSidebarWidth] = useState(320);

    const sessionData = {
        duration,
        videoName: 'Training Session - Big Buck Bunny',
        sessionDate: new Date(),
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (time: number) => {
        setCurrentTime(time);
    };

    const handleTimeUpdate = (time: number) => {
        setCurrentTime(time);
    };

    const handleDurationChange = (newDuration: number) => {
        setDuration(newDuration);
    };

    const handleAddAnnotation = () => {
        // Pause video when adding annotation
        setIsPlaying(false);
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
    };

    const handleDeleteAnnotation = (id: string) => {
        setAnnotations(annotations.filter(a => a.id !== id));
    };

    const handleSeekToAnnotation = (time: number) => {
        setCurrentTime(time);
    };

    // Handle vertical resize (timeline height)
    const handleVerticalResize = (delta: number) => {
        const minTimelineHeight = 150;
        const maxTimelineHeight = 400;

        setTimelineHeight((prev) => {
            const newHeight = prev - delta; // Subtract because dragging up should increase timeline height
            return Math.max(minTimelineHeight, Math.min(maxTimelineHeight, newHeight));
        });
    };

    // Handle horizontal resize (sidebar width)
    const handleHorizontalResize = (delta: number) => {
        const minSidebarWidth = 200;
        const maxSidebarWidth = 600;

        setSidebarWidth((prev) => {
            const newWidth = prev - delta; // Subtract because dragging left should increase sidebar width
            return Math.max(minSidebarWidth, Math.min(maxSidebarWidth, newWidth));
        });
    };

    // Auto-advance time when playing
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setCurrentTime((prev) => {
                if (prev >= duration) {
                    setIsPlaying(false);
                    return duration;
                }
                return prev + 0.1;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying, duration]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Space bar for play/pause
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                setIsPlaying(prev => !prev);
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
                <h1 className="text-lg text-zinc-100">Debriefing Session</h1>
                <div className="flex items-center gap-2">
                    <ExportControls annotations={annotations} sessionData={sessionData} />
                    <div className="w-px h-6 bg-zinc-700" />
                    <Button
                        onClick={handleAddAnnotation}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                    >
                        <Plus className="size-4 mr-2" />
                        Add Annotation (M)
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col">
                    {/* Video Panel - takes remaining space */}
                    <div className="flex-1 p-4 overflow-hidden">
                        <VideoPlayer
                            isPlaying={isPlaying}
                            currentTime={currentTime}
                            duration={duration}
                            onPlayPause={handlePlayPause}
                            onTimeUpdate={handleTimeUpdate}
                            onDurationChange={handleDurationChange}
                        />
                    </div>

                    {/* Resize Handle between Video and Timeline */}
                    <ResizeHandle direction="vertical" onResize={handleVerticalResize} />

                    {/* Timeline Panel - fixed height at bottom */}
                    <div className="shrink-0" style={{ height: `${timelineHeight}px` }}>
                        <Timeline
                            isPlaying={isPlaying}
                            currentTime={currentTime}
                            duration={duration}
                            annotations={annotations}
                            onPlayPause={handlePlayPause}
                            onSeek={handleSeek}
                        />
                    </div>
                </div>

                {/* Resize Handle between Main and Sidebar */}
                <ResizeHandle direction="horizontal" onResize={handleHorizontalResize} />

                {/* Annotations Sidebar - fixed width on right */}
                <div className="shrink-0" style={{ width: `${sidebarWidth}px` }}>
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
                currentTime={currentTime}
                onClose={() => setIsAnnotationDialogOpen(false)}
                onSave={handleSaveAnnotation}
            />
        </div>
    );
}

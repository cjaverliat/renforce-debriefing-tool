/**
 * Timeline track container component.
 *
 * Provides the structural shell for a single horizontal track row:
 *   - A fixed-height content area (default 64 px, configurable via `height`)
 *   - A canvas overlay on top of the content that draws the red playhead line
 *
 * The playhead canvas is a separate layer (z-index 10, pointer-events: none)
 * so it doesn't interfere with mouse events on the track content.
 *
 * The container's size is tracked via `ResizeObserver` so the playhead
 * canvas is redrawn whenever the panel is resized.
 */
import {useRef, useEffect, useState, type ReactNode} from 'react';
import type {PlaybackState} from '@/shared/types/playback.ts';
import {usePlaybackTime} from '@/renderer/hooks/use-playback-time.ts';

interface TimelineTrackProps {
    children: ReactNode;
    duration: number;
    playbackState: PlaybackState;
    pixelsPerSecond: number;
    /** Optional height in pixels. If not provided, defaults to 64px (h-16) */
    height?: number;
}

/**
 * Single timeline track row with a playhead overlay canvas.
 *
 * @param props.children          - The track content to render inside the row.
 * @param props.duration          - Record duration used to clamp the playhead position.
 * @param props.playbackState     - Anchor-based playback state.
 * @param props.pixelsPerSecond   - Spatial resolution for computing the playhead x position.
 * @param props.height            - Optional row height in pixels (default: 64).
 */
export function TimelineTrack({
                                  children,
                                  duration,
                                  playbackState,
                                  pixelsPerSecond,
                                  height,
                              }: TimelineTrackProps) {
    const playheadCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({width: 0, height: 0});

    const playbackTime = usePlaybackTime(playbackState, {maxTime: duration});

    // Track container size changes
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

    // Draw playhead (overlay) - updates frequently
    useEffect(() => {
        const canvas = playheadCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);

        // Clear canvas (transparent)
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Draw playhead
        const playheadX = playbackTime * pixelsPerSecond;

        if (playheadX >= 0 && playheadX <= rect.width) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(playheadX, 0);
            ctx.lineTo(playheadX, rect.height);
            ctx.stroke();
        }
    }, [duration, playbackTime, pixelsPerSecond, containerSize]);

    return (
        <div ref={containerRef} className="relative">
            <canvas
                ref={playheadCanvasRef}
                className="absolute w-full h-full pointer-events-none z-10"
            />
            <div
                className="relative border-b border-border bg-card"
                style={{height: height ? `${height}px` : '64px'}}
            >
                {children}
            </div>
        </div>
    );
}

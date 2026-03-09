/**
 * Timeline ruler component.
 *
 * Renders a canvas-based time ruler with:
 *   - Major ticks with `M:SS` labels at regular intervals
 *   - Minor ticks between major ticks
 *   - A triangular playhead marker that updates at ~60fps during playback
 *   - Visual distinction between the record region (normal colors) and
 *     the post-record region (dimmed colors)
 *
 * Tick intervals adapt to zoom level:
 *   - High zoom (>10 px/s): 5 s major / 1 s minor
 *   - Medium zoom (>15 px/s): 10 s major / 2 s minor  [threshold order in code]
 *   - Low zoom: 60 s major / 10 s minor
 *
 * Seeking:
 *   Click or drag on the ruler to seek to that time position (pointer events).
 *
 * Theme:
 *   Colors are re-read from CSS custom properties on every redraw so the ruler
 *   automatically reflects light/dark mode changes without a remount.
 */
import {useRef, useEffect} from 'react';
import {PlaybackState} from "@/shared/types/playback.ts";
import {usePlaybackTime} from "@/renderer/hooks/use-playback-time.ts";
import {useTheme} from "@/renderer/hooks/use-theme.tsx";

interface TimelineRulerProps {
    duration: number;
    playbackState: PlaybackState;
    pixelsPerSecond: number;
    onSeek: (time: number) => void;
}

interface RulerColors {
    background: string;
    recordArea: string;
    tickOutside: string;
    tickMajor: string;
    tickMinor: string;
    labelOutside: string;
    labelInside: string;
    playhead: string;
}

/**
 * Reads ruler colors from the current document theme.
 * Colors differ between the record region (inside duration) and the
 * post-record region (beyond the session end) to visually delimit the session.
 */
function getThemeColors(): RulerColors {
    const styles = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.classList.contains('dark');

    return {
        // Use more contrasted colors: outside area is dimmer, record area is prominent
        background: isDark ? '#1a1a24' : '#d4d4d8',
        recordArea: isDark ? '#252532' : '#f4f4f5',
        tickOutside: isDark ? '#464650' : '#a1a1aa',
        tickMajor: isDark ? '#a1a1aa' : '#52525b',
        tickMinor: isDark ? '#71717a' : '#71717a',
        labelOutside: isDark ? '#464650' : '#a1a1aa',
        labelInside: isDark ? '#a1a1aa' : '#52525b',
        playhead: '#ef4444',
    };
}

/**
 * Draws the ruler onto the canvas.
 * Re-sizes the canvas to match the element's current layout size (DPR-aware),
 * then draws background fills, tick marks, time labels, and the playhead triangle.
 *
 * @param canvasRef       - Ref to the canvas element.
 * @param pixelsPerSecond - Current zoom-scaled pixels-per-second value.
 * @param duration        - Record duration in seconds (determines the record region boundary).
 * @param playbackTime    - Current playback position in seconds (playhead position).
 */
function drawRuler(canvasRef: React.RefObject<HTMLCanvasElement>, pixelsPerSecond: number, duration: number, playbackTime: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getThemeColors();

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    // Determine tick interval based on zoom
    let majorTickInterval: number;
    let minorTickInterval: number;

    if (pixelsPerSecond > 10) {
        majorTickInterval = 5;
        minorTickInterval = 1;
    } else if (pixelsPerSecond > 15) {
        majorTickInterval = 10;
        minorTickInterval = 2;
    } else {
        majorTickInterval = 60;
        minorTickInterval = 10;
    }

    const recordWidth = duration * pixelsPerSecond;
    const endTime = rect.width / pixelsPerSecond;

    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = colors.recordArea;
    ctx.fillRect(0, 0, recordWidth, rect.height);

    // Draw ticks
    for (let time = 0; time <= endTime; time += minorTickInterval) {

        const x = time * pixelsPerSecond;
        const isMajor = time % majorTickInterval === 0;

        const outsideTimeRange = time > duration;

        if (outsideTimeRange) {
            ctx.strokeStyle = colors.tickOutside;
        } else {
            ctx.strokeStyle = isMajor ? colors.tickMajor : colors.tickMinor;
        }

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, rect.height);
        ctx.lineTo(x, rect.height - (isMajor ? 12 : 6));
        ctx.stroke();

        // Draw time labels for major ticks
        if (isMajor) {
            const mins = Math.floor(time / 60);
            const secs = Math.floor(time % 60);
            const label = `${mins}:${secs.toString().padStart(2, '0')}`;

            if (outsideTimeRange) {
                ctx.fillStyle = colors.labelOutside;
            } else {
                ctx.fillStyle = colors.labelInside;
            }

            ctx.font = '10px sans-serif';
            ctx.fillText(label, x + 2, 10);
        }
    }

    // Draw playhead
    const playheadX = playbackTime * pixelsPerSecond;
    if (playheadX >= 0 && playheadX <= rect.width) {
        ctx.fillStyle = colors.playhead;
        ctx.beginPath();
        ctx.moveTo(playheadX, rect.height);
        ctx.lineTo(playheadX - 5, rect.height - 8);
        ctx.lineTo(playheadX + 5, rect.height - 8);
        ctx.closePath();
        ctx.fill();
    }
}

/**
 * Canvas-based timeline ruler with seek-by-click/drag support.
 *
 * @param props.duration          - Total record duration in seconds.
 * @param props.playbackState     - Anchor-based state for computing the playhead position.
 * @param props.pixelsPerSecond   - Zoom-scaled spatial resolution.
 * @param props.onSeek            - Callback invoked when the user clicks or drags the ruler.
 */
export function TimelineRuler({
    duration,
    playbackState,
    pixelsPerSecond,
    onSeek,
}: TimelineRulerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDragging = useRef(false);
    const {resolvedTheme} = useTheme();

    const playbackTime = usePlaybackTime(playbackState, { maxTime: duration });

    useEffect(() => {
        drawRuler(canvasRef, pixelsPerSecond, duration, playbackTime);
    }, [duration, playbackTime, pixelsPerSecond, resolvedTheme]);

    useEffect(() => {
        const container = canvasRef.current;
        if (!container) return;

        const handleResize = () => {
            drawRuler(canvasRef, pixelsPerSecond, duration, playbackTime);
        }

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, [duration, playbackTime, pixelsPerSecond, resolvedTheme]);

    const seekToMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = x / pixelsPerSecond;

        onSeek(Math.max(0, Math.min(duration, time)));
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        isDragging.current = true;
        seekToMouse(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDragging.current) return;
        seekToMouse(e);
    };

    const handlePointerUp = () => {
        isDragging.current = false;
    };

    return (
        <div className="h-8 border-b shrink-0 border-border bg-accent">
            <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full cursor-pointer"
                style={{touchAction: 'none', width: '100%', height: '32px'}}
            />
        </div>
    );
}

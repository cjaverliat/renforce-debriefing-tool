import {useRef, useEffect} from 'react';
import {PlaybackState} from "@/shared/types/playback.ts";
import {usePlaybackTime} from "@/renderer/hooks/use-playback-time.ts";

interface TimelineRulerProps {
    duration: number;
    playbackState: PlaybackState;
    pixelsPerSecond: number;
    onSeek: (time: number) => void;
}

function drawRuler(canvasRef: React.RefObject<HTMLCanvasElement>, pixelsPerSecond: number, duration: number, playbackTime: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, 0, recordWidth, rect.height);

    // Draw ticks
    for (let time = 0; time <= endTime; time += minorTickInterval) {

        const x = time * pixelsPerSecond;
        const isMajor = time % majorTickInterval === 0;

        const outsideTimeRange = time > duration;

        if (outsideTimeRange) {
            ctx.strokeStyle = '#26262b';
        } else {
            ctx.strokeStyle = isMajor ? '#71717a' : '#3f3f46';
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
                ctx.fillStyle = '#464650';
            } else {
                ctx.fillStyle = '#a1a1aa';
            }

            ctx.font = '10px sans-serif';
            ctx.fillText(label, x + 2, 10);
        }
    }

    // Draw playhead
    const playheadX = playbackTime * pixelsPerSecond;
    if (playheadX >= 0 && playheadX <= rect.width) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(playheadX, rect.height);
        ctx.lineTo(playheadX - 5, rect.height - 8);
        ctx.lineTo(playheadX + 5, rect.height - 8);
        ctx.closePath();
        ctx.fill();
    }
}

export function TimelineRuler({
    duration,
    playbackState,
    pixelsPerSecond,
    onSeek,
}: TimelineRulerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDragging = useRef(false);

    const playbackTime = usePlaybackTime(playbackState, { maxTime: duration });

    useEffect(() => {
        drawRuler(canvasRef, pixelsPerSecond, duration, playbackTime);
    }, [duration, playbackTime, pixelsPerSecond]);

    useEffect(() => {
        const container = canvasRef.current;
        if (!container) return;

        const handleResize = () => {
            drawRuler(canvasRef, pixelsPerSecond, duration, playbackTime);
        }

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, [duration, playbackTime, pixelsPerSecond]);

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
        <div className="h-8 border-b shrink-0 border-zinc-800 bg-zinc-800">
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

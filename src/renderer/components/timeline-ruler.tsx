import {useRef, useEffect, useState} from 'react';

interface TimelineRulerProps {
    duration: number;
    currentTime: number;
    zoom: number;
    scrollOffset: number;
    onSeek: (time: number) => void;
}

export function TimelineRuler({
                                  duration,
                                  currentTime,
                                  zoom,
                                  scrollOffset,
                                  onSeek,
                              }: TimelineRulerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const [containerSize, setContainerSize] = useState({width: 0, height: 0});

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

        const pixelsPerSecond = (rect.width / duration) * zoom;
        const startTime = scrollOffset / pixelsPerSecond;

        // Determine tick interval based on zoom
        let majorTickInterval: number;
        let minorTickInterval: number;

        if (zoom > 3) {
            majorTickInterval = 5;
            minorTickInterval = 1;
        } else if (zoom > 1.5) {
            majorTickInterval = 10;
            minorTickInterval = 2;
        } else {
            majorTickInterval = 60;
            minorTickInterval = 10;
        }

        const recordWidth = duration * pixelsPerSecond;
        const visibleWidth = rect.width;
        const visibleDuration = visibleWidth / pixelsPerSecond;

        // Clear canvas
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, visibleWidth, rect.height);
        ctx.fillStyle = '#27272a';
        ctx.fillRect(0, 0, recordWidth, rect.height);

        // Draw ticks
        for (let time = 0; time <= visibleDuration; time += minorTickInterval) {

            const x = (time - startTime) * pixelsPerSecond;
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
        const playheadX = (currentTime - startTime) * pixelsPerSecond;
        if (playheadX >= 0 && playheadX <= rect.width) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(playheadX, rect.height);
            ctx.lineTo(playheadX - 5, rect.height - 8);
            ctx.lineTo(playheadX + 5, rect.height - 8);
            ctx.closePath();
            ctx.fill();
        }
    }, [duration, currentTime, zoom, scrollOffset, containerSize]);

    const seekToMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pixelsPerSecond = (rect.width / duration) * zoom;
        const startTime = scrollOffset / pixelsPerSecond;
        const time = startTime + (x / pixelsPerSecond);

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
        <div className="flex border-b border-zinc-800">
            <div className="w-32 shrink-0 bg-zinc-900 border-r border-zinc-800 sticky left-0 z-10"/>
            <div ref={containerRef} className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className="w-full h-8 cursor-pointer"
                    style={{touchAction: 'none', width: '100%', height: '32px'}}
                />
            </div>
        </div>
    );
}

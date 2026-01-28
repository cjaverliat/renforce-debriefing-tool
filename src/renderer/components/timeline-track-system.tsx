import {useEffect, useRef, useState} from "react";
import {SystemMarker} from "@/shared/types/record.ts";

// Marker track content component
interface SystemContentProps {
    markers: SystemMarker[];
    duration: number;
    pixelsPerSecond: number;
}

export function SystemContent({markers, duration, pixelsPerSecond}: SystemContentProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({width: 0, height: 0});

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

        // Clear canvas
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, rect.width, rect.height);

        // Draw markers
        markers.forEach((marker) => {
            const x = marker.time * pixelsPerSecond;

            const color = "#f8ba33"

            if (x >= 0 && x <= rect.width) {
                // Draw marker line
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, rect.height);
                ctx.stroke();

                // Draw marker label
                ctx.fillStyle = color;
                ctx.font = '10px sans-serif';
                ctx.fillText(marker.label, x + 4, 14);
            }
        });
    }, [markers, duration, pixelsPerSecond, containerSize]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        </div>
    );
}
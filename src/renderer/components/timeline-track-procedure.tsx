import {useEffect, useRef, useState} from "react";
import {Procedure} from "@/shared/types/record.ts";

// Marker track content component
interface ProcedureContentProps {
    procedure: Procedure;
    duration: number;
    pixelsPerSecond: number;
}

export function ProcedureContent({procedure, duration, pixelsPerSecond}: ProcedureContentProps) {
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

        const startTimeX = procedure.startTime * pixelsPerSecond;
        const endTimeX = (procedure.endTime < 0 ? duration : procedure.endTime) * pixelsPerSecond;

        const procedureBarHeight = canvas.height * 0.3;

        const color = "#3a51cd";

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(startTimeX, 3, endTimeX - startTimeX, procedureBarHeight, 5); // x, y, width, height, radius
        ctx.fill();

        // Draw markers
        procedure.actionMarkers.forEach((marker) => {

            const x = marker.time * pixelsPerSecond;

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
                ctx.fillText(marker.label, x + 4, canvas.height - 10);
            }
        });
    }, [procedure, duration, pixelsPerSecond, containerSize]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        </div>
    );
}
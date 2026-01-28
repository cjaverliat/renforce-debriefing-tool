import {useEffect, useMemo, useRef, useState} from "react";

// Signal track content component
interface SignalContentProps {
    data: Array<{ time: number; value: number }>;
    duration: number;
    pixelsPerSecond: number;
    color: string;
}

export function SignalContent({data, duration, pixelsPerSecond, color}: SignalContentProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({width: 0, height: 0});

    // Calculate min/max for normalization
    const {minValue, maxValue} = useMemo(() => {
        if (data.length === 0) return {minValue: 0, maxValue: 1};
        let min = data[0].value;
        let max = data[0].value;
        for (const sample of data) {
            if (sample.value < min) min = sample.value;
            if (sample.value > max) max = sample.value;
        }
        // Add small padding to prevent clipping
        const padding = (max - min) * 0.1;
        return {minValue: min - padding, maxValue: max + padding};
    }, [data]);

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

        // Draw signal waveform
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        // Calculate visible time range
        const endTime = rect.width / pixelsPerSecond;
        const valueRange = maxValue - minValue;

        // Filter to visible samples and draw at correct positions
        let isFirstPoint = true;
        for (const sample of data) {
            // Skip samples outside visible range (with small margin)
            if (sample.time < -1 || sample.time > endTime + 1) continue;

            const x = (sample.time) * pixelsPerSecond;
            // Normalize value to 0-1 range, then map to canvas height (inverted for canvas coords)
            const normalizedValue = (sample.value - minValue) / valueRange;
            const y = rect.height - (normalizedValue * rect.height);

            if (isFirstPoint) {
                ctx.moveTo(x, y);
                isFirstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }, [data, duration, pixelsPerSecond, color, containerSize, minValue, maxValue]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        </div>
    );
}
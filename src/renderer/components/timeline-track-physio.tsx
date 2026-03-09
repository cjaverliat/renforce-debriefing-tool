/**
 * Physiological signal track content component.
 *
 * Renders a canvas waveform for a single physiological signal (e.g. heart rate).
 *
 * Drawing strategy:
 *   - Min/max of the data are computed once via `useMemo` and used to normalize
 *     values to the canvas height (Y inverted: high values near top).
 *   - A 10% padding is added above and below the value range to prevent clipping.
 *   - Samples outside the visible time window are skipped for performance.
 *   - The canvas is redrawn whenever data, zoom, color, container size, or theme changes.
 *   - DPR scaling ensures crisp rendering on high-density displays.
 */
import {useEffect, useMemo, useRef, useState} from "react";
import {useTheme} from "@/renderer/hooks/use-theme.tsx";

/** Reads the --card CSS variable to match the track's background color for canvas fill. */
function getTrackBackgroundColor(): string {
    // Use the --card CSS variable to match the timeline-track bg-card background
    return getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
}

// Signal track content component
interface SignalContentProps {
    data: Array<{ time: number; value: number }>;
    duration: number;
    pixelsPerSecond: number;
    color: string;
}

/**
 * Canvas waveform renderer for a single physiological signal.
 *
 * @param props.data            - Time-series data points `{ time, value }`.
 * @param props.duration        - Record duration (unused directly but triggers redraws on change).
 * @param props.pixelsPerSecond - Spatial resolution mapping time to x-coordinate.
 * @param props.color           - Stroke color for the waveform line.
 */
export function SignalContent({data, duration, pixelsPerSecond, color}: SignalContentProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({width: 0, height: 0});
    const {resolvedTheme} = useTheme();

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
        ctx.fillStyle = getTrackBackgroundColor();
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
    }, [data, duration, pixelsPerSecond, color, containerSize, minValue, maxValue, resolvedTheme]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <canvas
                ref={canvasRef}
                className="w-full h-full"
            />
        </div>
    );
}
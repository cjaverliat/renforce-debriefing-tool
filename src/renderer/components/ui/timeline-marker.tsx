/**
 * Timeline marker pin primitive (UI component).
 *
 * Renders a thin vertical bar at an absolute `position` (pixels from left edge).
 * When `isSelected`, the bar widens to 4 px and gains a glow shadow for emphasis.
 *
 * If a `tooltip` is provided, the bar is wrapped in a Radix UI `Tooltip`.
 * If no tooltip is provided, the bare `<div>` is returned without the tooltip
 * wrapper to avoid unnecessary DOM nodes.
 *
 * Used by every track content component (annotations, system markers,
 * incidents, and procedure action markers).
 */
import * as React from "react";
import {Tooltip, TooltipContent, TooltipTrigger} from "./tooltip";

interface TimelineMarkerProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Position in pixels from the left edge */
    position: number;
    /** Optional tooltip content (shown on hover) */
    tooltip?: React.ReactNode;
    color?: string;
    /** Optional click handler */
    onClick?: () => void;
    /** Whether this marker is currently selected */
    isSelected?: boolean;
}

/**
 * Renders a colored vertical marker pin at an absolute pixel position.
 *
 * @param props.position   - Left offset in pixels (= time × pixelsPerSecond).
 * @param props.tooltip    - Optional content shown in a hover tooltip.
 * @param props.color      - Pin color (CSS color string, default amber).
 * @param props.onClick    - Click handler (seeks + selects the marker).
 * @param props.isSelected - When true, renders wider with a glow effect.
 */
export function TimelineMarker({position, tooltip, color = "#f8ba33", onClick, isSelected}: TimelineMarkerProps) {
    const markerContent = (
        <div
            className={`absolute h-full cursor-pointer transition-all ${isSelected ? 'w-1' : 'w-0.5'}`}
            style={{
                left: position,
                backgroundColor: color,
                boxShadow: isSelected ? `0 0 6px 3px ${color}80` : undefined,
            }}
            onClick={onClick}
        >
        </div>
    );

    if (tooltip) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    {markerContent}
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
        );
    }

    return markerContent;
}

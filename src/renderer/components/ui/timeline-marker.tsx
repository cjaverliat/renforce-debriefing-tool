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

import * as React from "react";
import {Tooltip, TooltipContent, TooltipTrigger} from "./tooltip";

interface TimelineMarkerProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Position in pixels from the left edge */
    position: number;
    /** Optional tooltip content (shown on hover) */
    tooltip?: React.ReactNode;
    color?: string;
}

export function TimelineMarker({position, tooltip, color = "#f8ba33"}: TimelineMarkerProps) {
    const markerContent = (
        <div
            className={"absolute h-full cursor-pointer w-0.5"}
            style={{left: position, backgroundColor: color}}
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

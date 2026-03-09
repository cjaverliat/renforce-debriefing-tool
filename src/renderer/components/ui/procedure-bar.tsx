import * as React from "react";
import {Tooltip, TooltipContent, TooltipTrigger} from "./tooltip";
import {Procedure} from "@/shared/types/record.ts";

interface ProcedureBarProps extends React.HTMLAttributes<HTMLDivElement> {
    procedure: Procedure;
    pixelsPerSecond: number;
    duration: number;
    /** Optional tooltip content (shown on hover) */
    tooltip?: React.ReactNode;
    color: string;
    /** Whether this bar is currently selected */
    isSelected?: boolean;
    /** Optional click handler */
    onClick?: () => void;
}

export function ProcedureBar({procedure, pixelsPerSecond, duration, tooltip, color = "#516db1", isSelected, onClick}: ProcedureBarProps) {

    const startPosition = procedure.startTime * pixelsPerSecond;
    const endPosition = (procedure.endTime < 0 ? duration : procedure.endTime) * pixelsPerSecond;
    const width = endPosition - startPosition;

    const barContent = (
        <div
            className={`absolute rounded-sm h-full cursor-pointer transition-all ${isSelected ? 'brightness-125 outline outline-2 outline-white/50' : ''}`}
            style={{left: startPosition, width: width, backgroundColor: color}}
            onClick={onClick}
        />
    );

    if (tooltip) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    {barContent}
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
        );
    }

    return barContent;
}
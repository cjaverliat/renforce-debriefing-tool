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
}

export function ProcedureBar({procedure, pixelsPerSecond, duration, tooltip, color = "#516db1"}: ProcedureBarProps) {

    const startPosition = procedure.startTime * pixelsPerSecond;
    const endPosition = (procedure.endTime < 0 ? duration : procedure.endTime) * pixelsPerSecond;
    const width = endPosition - startPosition;

    const barContent = (
        <div
            className="absolute rounded-md h-full cursor-pointer"
            style={{left: startPosition, width: width, backgroundColor: color}}
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
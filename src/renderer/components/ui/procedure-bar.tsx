import * as React from "react";
import {Tooltip, TooltipContent, TooltipTrigger} from "./tooltip";
import {Procedure} from "@/shared/types/record.ts";

interface ProcedureBarProps extends React.HTMLAttributes<HTMLDivElement> {
    procedure: Procedure;
    pixelsPerSecond: number;
    duration: number;
    /** Optional tooltip content (shown on hover) */
    tooltip?: React.ReactNode;
}

export function ProcedureBar({procedure, pixelsPerSecond, duration, tooltip}: ProcedureBarProps) {

    const startPosition = procedure.startTime * pixelsPerSecond;
    const endPosition = (procedure.endTime < 0 ? duration : procedure.endTime) * pixelsPerSecond;
    const width = endPosition - startPosition;

    const barContent = (
        <div
            className={"absolute rounded-md h-full bg-blue-400 cursor-pointer"}
            style={{left: startPosition, width}}
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
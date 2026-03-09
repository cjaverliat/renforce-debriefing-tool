/**
 * Procedure bar primitive (UI component).
 *
 * Renders a colored horizontal bar spanning from a procedure's start time to
 * its end time, positioned absolutely within its parent track row.
 *
 * When `procedure.endTime < 0`, the bar extends to the full `duration`
 * (indicating the procedure is open-ended / runs to the session end).
 *
 * When `isSelected`, the bar brightens and gains a white outline ring.
 * If a `tooltip` is provided, the bar is wrapped in a Radix UI `Tooltip`.
 */
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

/**
 * Renders a colored horizontal bar representing a procedure's time span.
 *
 * @param props.procedure        - The procedure data (provides startTime and endTime).
 * @param props.pixelsPerSecond  - Spatial resolution for computing left/width positions.
 * @param props.duration         - Record duration used when endTime is -1 (open-ended).
 * @param props.tooltip          - Optional hover tooltip content.
 * @param props.color            - Bar fill color (default: muted blue #516db1).
 * @param props.isSelected       - When true, brightens the bar and adds a white outline.
 * @param props.onClick          - Click handler (selects the procedure).
 */
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
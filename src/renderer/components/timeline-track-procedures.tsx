import {Procedure, ProcedureActionMarker} from "@/shared/types/record.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";
import {ProcedureBar} from "@/renderer/components/ui/procedure-bar.tsx";

const ACTION_MARKER_COLORS: Record<ProcedureActionMarker['category'], string> = {
    correct_action: '#22c55e',     // Green
    incorrect_action: '#ef4444',   // Red
    timeout_exceeded: '#f97316',   // Orange
};

interface ProceduresContentProps {
    procedures: Procedure[];
    duration: number;
    pixelsPerSecond: number;
    onSeek?: (time: number) => void;
}

interface ProcedureRowProps {
    procedure: Procedure;
    duration: number;
    pixelsPerSecond: number;
    index: number;
    onSeek?: (time: number) => void;
}

function ProcedureRow({procedure, duration, pixelsPerSecond, onSeek}: ProcedureRowProps) {
    return (
        <div
            className="relative flex-1 w-full"
        >
            {/* Procedure bar */}
            <ProcedureBar
                procedure={procedure}
                duration={duration}
                pixelsPerSecond={pixelsPerSecond}
                tooltip={procedure.name}
            />

            {/* Action markers */}
            {procedure.actionMarkers.map((marker, index) => (
                <TimelineMarker
                    key={index}
                    position={marker.time * pixelsPerSecond}
                    tooltip={marker.label}
                    color={ACTION_MARKER_COLORS[marker.category]}
                    onClick={() => onSeek?.(marker.time)}
                />
            ))}
        </div>
    );
}

export function ProceduresContent({procedures, duration, pixelsPerSecond, onSeek}: ProceduresContentProps) {
    return (
        <div className="flex flex-col w-full h-full py-2">
            {procedures.map((procedure, index) => (
                <ProcedureRow
                    key={procedure.id}
                    procedure={procedure}
                    duration={duration}
                    pixelsPerSecond={pixelsPerSecond}
                    index={index}
                    onSeek={onSeek}
                />
            ))}
        </div>
    );
}

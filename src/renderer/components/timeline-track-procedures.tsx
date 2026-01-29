import {Procedure} from "@/shared/types/record.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";
import {ProcedureBar} from "@/renderer/components/ui/procedure-bar.tsx";

interface ProceduresContentProps {
    procedures: Procedure[];
    duration: number;
    pixelsPerSecond: number;
}

interface ProcedureRowProps {
    procedure: Procedure;
    duration: number;
    pixelsPerSecond: number;
    index: number;
}

function ProcedureRow({procedure, duration, pixelsPerSecond}: ProcedureRowProps) {
    const actionColor = "#4286d1";

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
                    color={actionColor}
                />
            ))}
        </div>
    );
}

export function ProceduresContent({procedures, duration, pixelsPerSecond}: ProceduresContentProps) {
    return (
        <div className="flex flex-col w-full h-full">
            {procedures.map((procedure, index) => (
                <ProcedureRow
                    key={procedure.id}
                    procedure={procedure}
                    duration={duration}
                    pixelsPerSecond={pixelsPerSecond}
                    index={index}
                />
            ))}
        </div>
    );
}

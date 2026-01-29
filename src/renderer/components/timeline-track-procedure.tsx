import {Procedure} from "@/shared/types/record.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";
import {ProcedureBar} from "@/renderer/components/ui/procedure-bar.tsx";

interface ProcedureContentProps {
    procedure: Procedure;
    duration: number;
    pixelsPerSecond: number;
}

export function ProcedureContent({procedure, duration, pixelsPerSecond}: ProcedureContentProps) {
    const startX = procedure.startTime * pixelsPerSecond;
    const endTime = procedure.endTime < 0 ? duration : procedure.endTime;
    const barWidth = (endTime - procedure.startTime) * pixelsPerSecond;

    return (
        <div className="relative w-full h-full bg-zinc-900">
            {/* Procedure bar */}
            <ProcedureBar
                startPosition={startX}
                width={barWidth}
            />

            {/* Action markers */}
            {procedure.actionMarkers.map((marker, index) => (
                <TimelineMarker
                    key={`${marker.time}-${index}`}
                    variant="procedure"
                    position={marker.time * pixelsPerSecond}
                    label={marker.label}
                    labelPosition="bottom"
                    tooltip={marker.label}
                />
            ))}
        </div>
    );
}

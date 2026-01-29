import {Procedure} from "@/shared/types/record.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";
import {ProcedureBar} from "@/renderer/components/ui/procedure-bar.tsx";
import {useEffect, useRef, useState} from "react";

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
    height: number;
}

function ProcedureRow({procedure, duration, pixelsPerSecond, index, height}: ProcedureRowProps) {
    const topOffset = index * height;

    const actionColor = "#4286d1";

    return (
        <div
            className="absolute w-full"
            style={{top: topOffset, height: height}}
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

    const procedureContainerRef = useRef<HTMLDivElement | null>(null);
    const [rowHeight, setRowHeight] = useState(0);

    useEffect(() => {

        const procedureContainer = procedureContainerRef.current;

        if (!procedureContainer)
            return;

        const handleResize = () => {
            if (procedures.length == 0) {
                setRowHeight(0);
            } else {
                setRowHeight(procedureContainer.clientHeight / procedures.length);
            }
        }

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(procedureContainer);

        return () => {
            resizeObserver.disconnect();
        }
    }, []);

    return (
        <div ref={procedureContainerRef} className="relative w-full h-full">
            {procedures.map((procedure, index) => (
                <ProcedureRow
                    key={procedure.id}
                    procedure={procedure}
                    duration={duration}
                    pixelsPerSecond={pixelsPerSecond}
                    index={index}
                    height={rowHeight}
                />
            ))}
        </div>
    );
}

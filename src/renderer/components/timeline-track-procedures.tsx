import {Procedure, ProcedureActionMarker} from "@/shared/types/record.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";
import {ProcedureBar} from "@/renderer/components/ui/procedure-bar.tsx";

export const PROCEDURE_ROW_HEIGHT = 16; // px, fixed height per procedure row

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
    selectedProcedureId?: string;
    selectedActionMarker?: ProcedureActionMarker;
    onSelectProcedure?: (procedureId: string) => void;
    onSelectActionMarker?: (procedureId: string, marker: ProcedureActionMarker) => void;
}

interface ProcedureRowProps {
    procedure: Procedure;
    duration: number;
    pixelsPerSecond: number;
    index: number;
    onSeek?: (time: number) => void;
    selectedProcedureId?: string;
    selectedActionMarker?: ProcedureActionMarker;
    onSelectProcedure?: (procedureId: string) => void;
    onSelectActionMarker?: (procedureId: string, marker: ProcedureActionMarker) => void;
}

function ProcedureRow({procedure, duration, pixelsPerSecond, onSeek, selectedProcedureId, selectedActionMarker, onSelectProcedure, onSelectActionMarker}: ProcedureRowProps) {
    return (
        <div
            className="relative w-full"
            style={{height: `${PROCEDURE_ROW_HEIGHT}px`}}
        >
            {/* Procedure bar */}
            <ProcedureBar
                procedure={procedure}
                duration={duration}
                pixelsPerSecond={pixelsPerSecond}
                tooltip={procedure.name}
                isSelected={procedure.id === selectedProcedureId}
                onClick={() => onSelectProcedure?.(procedure.id)}
            />

            {/* Action markers */}
            {procedure.actionMarkers.map((marker) => (
                <TimelineMarker
                    key={marker.time}
                    position={marker.time * pixelsPerSecond}
                    tooltip={marker.label}
                    color={ACTION_MARKER_COLORS[marker.category]}
                    isSelected={marker === selectedActionMarker}
                    onClick={() => {
                        onSeek?.(marker.time);
                        onSelectActionMarker?.(procedure.id, marker);
                    }}
                />
            ))}
        </div>
    );
}

export function ProceduresContent({procedures, duration, pixelsPerSecond, onSeek, selectedProcedureId, selectedActionMarker, onSelectProcedure, onSelectActionMarker}: ProceduresContentProps) {
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
                    selectedProcedureId={selectedProcedureId}
                    selectedActionMarker={selectedActionMarker}
                    onSelectProcedure={onSelectProcedure}
                    onSelectActionMarker={onSelectActionMarker}
                />
            ))}
        </div>
    );
}

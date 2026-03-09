/**
 * Procedures track content component.
 *
 * Renders one horizontal row per procedure, each containing:
 *   - A `ProcedureBar` spanning from `startTime` to `endTime` (or full duration if endTime < 0)
 *   - `TimelineMarker` pins for each action marker inside the procedure,
 *     colored by category (green = correct, red = incorrect, orange = timeout)
 *
 * The track height is computed by the parent `Timeline` as:
 *   `max(64, procedures.length * PROCEDURE_ROW_HEIGHT + 16)`
 * so the track expands dynamically with the number of visible procedures.
 */
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

/**
 * Renders all procedure rows for the procedures timeline track.
 *
 * @param props.procedures            - Filtered list of procedures to display.
 * @param props.duration              - Record duration (for open-ended procedure bars).
 * @param props.pixelsPerSecond       - Spatial resolution.
 * @param props.onSeek                - Called when a marker is clicked.
 * @param props.selectedProcedureId   - ID of the currently selected procedure bar.
 * @param props.selectedActionMarker  - Currently selected action marker object.
 * @param props.onSelectProcedure     - Called when a procedure bar is clicked.
 * @param props.onSelectActionMarker  - Called when an action marker pin is clicked.
 */
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

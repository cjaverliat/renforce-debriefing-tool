/**
 * Incident markers track content component.
 *
 * Renders incident markers as `TimelineMarker` pins colored by severity:
 *   - critical → red (#ef4444)
 *   - moderate → orange (#f97316)
 *
 * Tooltips include both the label and the severity level.
 * Clicking a marker seeks to its time and updates cross-panel selection.
 */
import {IncidentMarker} from "@/shared/types/record.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";

const INCIDENT_SEVERITY_COLORS: Record<IncidentMarker['severity'], string> = {
    critical: '#ef4444',   // Red
    moderate: '#f97316',   // Orange
};

interface IncidentsContentProps {
    incidentMarkers: IncidentMarker[];
    pixelsPerSecond: number;
    onSeek?: (time: number) => void;
    selectedIncidentMarker?: IncidentMarker;
    onSelectIncidentMarker?: (marker: IncidentMarker) => void;
}

/**
 * Renders incident marker pins for the incidents timeline track.
 *
 * @param props.incidentMarkers         - Filtered incident markers to display.
 * @param props.pixelsPerSecond         - Spatial resolution.
 * @param props.onSeek                  - Called with the marker's time when clicked.
 * @param props.selectedIncidentMarker  - Currently selected incident marker (highlighted).
 * @param props.onSelectIncidentMarker  - Called with the marker object when clicked.
 */
export function IncidentsContent({incidentMarkers, pixelsPerSecond, onSeek, selectedIncidentMarker, onSelectIncidentMarker}: IncidentsContentProps) {
    return (
        <div className="relative w-full h-full">
            {incidentMarkers.map((marker, index) => (
                <TimelineMarker
                    key={index}
                    position={marker.time * pixelsPerSecond}
                    tooltip={`${marker.label} (${marker.severity})`}
                    color={INCIDENT_SEVERITY_COLORS[marker.severity]}
                    isSelected={marker === selectedIncidentMarker}
                    onClick={() => {
                        onSeek?.(marker.time);
                        onSelectIncidentMarker?.(marker);
                    }}
                />
            ))}
        </div>
    );
}

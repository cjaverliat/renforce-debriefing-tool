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

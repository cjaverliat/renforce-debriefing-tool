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
}

export function IncidentsContent({incidentMarkers, pixelsPerSecond, onSeek}: IncidentsContentProps) {
    return (
        <div className="relative w-full h-full">
            {incidentMarkers.map((marker, index) => (
                <TimelineMarker
                    key={index}
                    position={marker.time * pixelsPerSecond}
                    tooltip={`${marker.label} (${marker.severity})`}
                    color={INCIDENT_SEVERITY_COLORS[marker.severity]}
                    onClick={() => onSeek?.(marker.time)}
                />
            ))}
        </div>
    );
}

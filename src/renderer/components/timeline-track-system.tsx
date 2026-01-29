import {SystemMarker} from "@/shared/types/record.ts";
import {TimelineMarker} from "@/renderer/components/ui/timeline-marker.tsx";

interface SystemContentProps {
    markers: SystemMarker[];
    duration: number;
    pixelsPerSecond: number;
}

export function SystemContent({markers, pixelsPerSecond}: SystemContentProps) {
    return (
        <div className="relative w-full h-full bg-zinc-900">
            {/* System markers */}
            {markers.map((marker, index) => (
                <TimelineMarker
                    key={`${marker.time}-${marker.label}-${index}`}
                    variant="system"
                    position={marker.time * pixelsPerSecond}
                    label={marker.label}
                    labelPosition="top"
                    tooltip={marker.label}
                />
            ))}
        </div>
    );
}
